from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import psycopg2
import psycopg2.extras
import os
from dotenv import load_dotenv
import uvicorn
from openai import OpenAI
import chromadb
from chromadb.utils import embedding_functions
import hashlib
import json
from contextlib import asynccontextmanager
import asyncio
#from langchain.chains.sql_database.query import create_sql_query_chain
import re
load_dotenv()

# 1. Client GitHub Models
client = OpenAI(
    base_url="https://models.inference.ai.azure.com",
    api_key=os.getenv("GITHUB_TOKEN")
)

# 2. Embeddings OpenAI
openai_ef = embedding_functions.OpenAIEmbeddingFunction(
    api_key=os.getenv("GITHUB_TOKEN"),
    model_name="text-embedding-3-small",
    api_base="https://models.inference.ai.azure.com"
)

# 3. PostgreSQL
def get_db_connection():
    conn = psycopg2.connect(
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT"),
        dbname=os.getenv("DB_DATABASE"),
        user=os.getenv("DB_USERNAME"),
        password=os.getenv("DB_PASSWORD")
    )
    conn.cursor().execute("SET search_path TO app, public")
    conn.commit()
    return conn

# 4. Mémoire persistante
def save_message(session_id, role, content):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO chat_sessions (session_id, role, content) VALUES (%s, %s, %s)",
        (session_id, role, content)
    )
    conn.commit()
    cur.close()
    conn.close()

def get_history(session_id, limit=10):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    cur.execute(
        "SELECT role, content FROM chat_sessions WHERE session_id = %s ORDER BY created_at ASC LIMIT %s",
        (session_id, limit)
    )
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return [{"role": row["role"], "content": row["content"]} for row in rows]

def clear_history(session_id):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM chat_sessions WHERE session_id = %s", (session_id,))
    conn.commit()
    cur.close()
    conn.close()

# 5. ChromaDB
chroma_client = chromadb.PersistentClient(path="./chroma_db")
collection_name = "formations"
collection = chroma_client.get_or_create_collection(
    name=collection_name,
    embedding_function=openai_ef
)

def sync_formations_to_chroma():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT id, title, description, domaine, niveau FROM formations;")
    rows = cur.fetchall()
    cur.close()
    conn.close()

    documents = []
    metadatas = []
    ids = []

    for row in rows:
        formation_id, title, description, domaine, niveau = row
        # Inclure domaine et niveau dans le texte indexé pour améliorer la pertinence sémantique
        doc_text = f"{title}\nDomaine: {domaine or ''}\nNiveau: {niveau or ''}\n{description or ''}"
        doc_id = hashlib.md5(doc_text.encode()).hexdigest()
        documents.append(doc_text)
        metadatas.append({"id": formation_id, "title": title, "domaine": domaine or ""})
        ids.append(doc_id)

    existing_ids = collection.get()["ids"]
    if existing_ids:
        collection.delete(ids=existing_ids)
    if ids:
        collection.add(documents=documents, metadatas=metadatas, ids=ids)
    return len(ids)

class ChatRequest(BaseModel):
    message: str
    session_id: str = "default"

# 6. Lifespan
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🔄 Synchronisation des formations dans ChromaDB...")
    for attempt in range(5):
        try:
            count = sync_formations_to_chroma()
            print(f"✅ {count} formations synchronisées")
            break
        except Exception as e:
            print(f"⚠ Tentative {attempt + 1}/5 — DB indisponible: {e}")
            if attempt < 4:
                await asyncio.sleep(3)
    yield
    print("🛑 Arrêt du service chatbot...")

# 7. Création de l'application FastAPI (APRÈS lifespan)
app = FastAPI(
    title="BRN SMART Chatbot IA",
    description="Chatbot RAG pour recommandation de formations",
    lifespan=lifespan
)

# 8. CORS (APRÈS la création de app)
_raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
_allowed_origins = [o.strip() for o in _raw_origins.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 9. Endpoints
@app.get("/")
def root():
    return {"message": "Chatbot IA - BRN SMART"}

@app.get("/formations")
def get_formations():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT id, title, description FROM formations;")
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return {"formations": [{"id": r[0], "title": r[1], "description": r[2]} for r in rows]}


# Connexion à PostgreSQL pour LangChain
class AnalyticsRequest(BaseModel):
    question: str

@app.post("/analytics")
def generate_analytics(request: AnalyticsRequest):
    try:
        # 1. Générer la requête SQL avec GPT-4o avec le schéma exact des tables
        sql_prompt = f"""Tu es un expert SQL PostgreSQL pour la plateforme BRN SMART.
Génère une requête SQL SELECT valide et optimisée pour répondre à la question: "{request.question}"

Voici le schéma exact des tables disponibles :
1. formations (Catalogue de formations) :
   - id : BIGINT (Clé primaire)
   - title : VARCHAR (Titre de la formation)
   - description : TEXT (Description du contenu)
   - nom_formateur : VARCHAR (Nom du formateur principal)
   - domaine : VARCHAR (Domaine : Informatique, Management, Design...)
   - niveau : VARCHAR (Niveau : Débutant, Intermédiaire, Avancé)
   - prix : NUMERIC (Prix en DT)
   - places_totales : INTEGER (Nombre de places)
   - statut : VARCHAR (actif, inactif)
   - date_debut : DATE
   - date_fin : DATE
   - created_at : TIMESTAMP

2. inscriptions_formation (Besoins et préférences des stagiaires/étudiants) :
   - id : BIGINT (Clé primaire)
   - niveau : VARCHAR (Niveau du stagiaire: Débutant, Intermédiaire, Avancé)
   - rythme : VARCHAR (Plein temps, Temps partiel)
   - objectif : VARCHAR (Reconversion, Montée en compétences, etc.)
   - disponibilite : VARCHAR (Semaine, Weekend, Soir)
   - groupe_estime : VARCHAR
   - created_at : TIMESTAMP

3. formation_realises (Formations qui ont été effectivement réalisées/clôturées) :
   - id : BIGINT (Clé primaire)
   - nbr_participants : INTEGER (Nombre de participants présents)
   - formateur : VARCHAR (Nom du formateur)
   - formation : VARCHAR (Titre de la formation réalisée)
   - date_realisation : DATE (Date de tenue de la formation)

4. financier_candidats (États des paiements des candidats) :
   - id : BIGINT (Clé primaire)
   - nom : VARCHAR (Nom du candidat)
   - prenom : VARCHAR (Prénom du candidat)
   - etat_payment : VARCHAR (Ex: Payé, En attente, Non payé)
   - mode_payment : VARCHAR (Virement, Espèces, Carte)
   - montant : INTEGER (Montant total en DT)
   - avance : INTEGER (Avance payée en DT)
   - rest_a_payer : INTEGER (Reste à payer en DT)

5. inscription__candidats (Inscriptions soumises par les candidats) :
   - id : BIGINT (Clé primaire)
   - nom : VARCHAR
   - prenom : VARCHAR
   - email : VARCHAR
   - situation : VARCHAR (Étudiant, Employé, Sans emploi)
   - format : VARCHAR (En ligne, Présentiel)
   - statut : VARCHAR (en_attente, accepte, refuse)

Règles importantes :
- Spécifie sur la toute première ligne le type de graphique le plus adapté sous la forme d'un commentaire SQL: `-- CHART_TYPE: bar` ou `-- CHART_TYPE: pie` ou `-- CHART_TYPE: line`.
- Ne génère QUE la requête SQL SELECT. Aucun autre texte, aucune explication.
- Utilise uniquement les tables et colonnes listées ci-dessus.
- Ne fais pas de jointures impossibles entre des tables sans clé commune.
- Si le résultat attendu contient des comptages par catégorie, utilise GROUP BY.

Exemple de format attendu :
-- CHART_TYPE: pie
SELECT niveau, COUNT(*) FROM inscriptions_formation GROUP BY niveau;"""
        
        sql_response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": sql_prompt}]
        )
        sql_query = sql_response.choices[0].message.content.strip()
        
        # Nettoyage robuste du bloc de code Markdown
        sql_query = re.sub(r'^```sql\n|^```[a-zA-Z]*\n|^```|```$', '', sql_query).strip()
        
        # 2. Déterminer le type de graphique
        chart_type = "bar"
        chart_match = re.search(r'--\s*CHART_TYPE:\s*(bar|pie|line)', sql_query, re.IGNORECASE)
        if chart_match:
            chart_type = chart_match.group(1).lower()
        else:
            # Fallback sémantique sur la question
            q_lower = request.question.lower()
            if any(k in q_lower for k in ["distribution", "répartition", "part", "pourcentage", "proportion"]):
                chart_type = "pie"
            elif any(k in q_lower for k in ["évolution", "tendance", "mois", "année", "date", "historique"]):
                chart_type = "line"
        
        # 3. Exécuter la requête SQL avec Fallback intelligent si 0 résultat
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        
        try:
            cur.execute(sql_query)
            rows = cur.fetchall() if cur.description else []
        except Exception as sql_err:
            # En cas de bug d'exécution SQL, on force un ensemble de lignes vide pour activer le fallback
            rows = []
            
        data = [dict(row) for row in rows]
        
        # ── SYSTEME DE FALLBACK POUR EVITER LES GRAPHISTES VIDES ──────────────────
        if len(data) == 0:
            # Si le SQL complexe a échoué ou a retourné 0 résultat (ex: jointure vide)
            # On génère une requête de secours simple et robuste sur le catalogue 'formations'
            q_lower = request.question.lower()
            keywords = ["intelligence artificielle", "machine learning", "deep learning", "nlp", "mobile", "flutter", "dev", "web", "ia", "intelligence", "python", "data", "cyber", "agile", "scrum", "figma", "design", "marketing", "cloud", "sql", "java", "react"]
            matched_keyword = "formations"
            for kw in keywords:
                if kw in q_lower:
                    matched_keyword = kw
                    break
                    
            if matched_keyword != "formations":
                # Si l'utilisateur cherchait un sujet précis, on liste les formations correspondantes
                sql_query = f"""-- CHART_TYPE: bar\n-- [Secours] Formations liées à '{matched_keyword}'\nSELECT title, duree AS valeur\nFROM formations\nWHERE LOWER(title) LIKE '%{matched_keyword}%' OR LOWER(description) LIKE '%{matched_keyword}%' OR LOWER(domaine) LIKE '%{matched_keyword}%'\nORDER BY title;"""
            else:
                # Sinon répartition globale par domaine
                sql_query = """-- CHART_TYPE: pie\n-- [Secours] Distribution globale par domaine\nSELECT domaine, COUNT(*) AS total\nFROM formations\nGROUP BY domaine\nORDER BY total DESC;"""
                chart_type = "pie"
                
            try:
                cur.execute(sql_query)
                rows = cur.fetchall() if cur.description else []
                data = [dict(row) for row in rows]
            except Exception:
                data = []
                
        cur.close()
        conn.close()
        
        # 5. Générer un insight IA à partir des données réelles
        if len(data) > 0:
            insight_prompt = f"""Tu es un analyste business expert pour BRN SMART.
En te basant sur la question de l'administrateur et les données réelles obtenues de la base de données, génère un insight court, percutant et très professionnel (1-2 phrases maximum) en français.

Question de l'admin: {request.question}
Données obtenues: {data}

Règle: Sois direct, cite des chiffres ou tendances clés présents dans les données si c'est pertinent."""
            
            insight_response = client.chat.completions.create(
                model="gpt-4o",
                messages=[{"role": "user", "content": insight_prompt}]
            )
            insight = insight_response.choices[0].message.content.strip()
        else:
            insight = "Aucune formation correspondante trouvée dans le catalogue pour cette recherche spécifique."
        
        return {
            "success": True,
            "sql": sql_query,
            "data": data,
            "insight": insight,
            "chart_type": chart_type,
            "question": request.question
        }
        
    except Exception as e:
        return {"success": False, "error": str(e)}
@app.post("/chat")
def chat(request: ChatRequest):
    history = get_history(request.session_id)
    
    history_text = ""
    for msg in history[-6:]:
        role = "Utilisateur" if msg["role"] == "user" else "Assistant"
        history_text += f"{role}: {msg['content']}\n"
    
    results = collection.query(query_texts=[request.message], n_results=5)
    
    context = ""
    if results["documents"] and results["documents"][0]:
        for i, doc in enumerate(results["documents"][0]):
            context += f"\n--- Formation {i+1} ---\n{doc}\n"
    
    if not context:
        return {"response": "Aucune formation trouvée."}
    
    prompt = f"""Tu es un conseiller pédagogique.

Historique : {history_text}
Catalogue : {context}
Question : {request.message}
Réponds uniquement à partir du catalogue."""
    
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "Conseiller pédagogique. Réponds uniquement à partir du catalogue."},
            {"role": "user", "content": prompt}
        ]
    )
    
    answer = response.choices[0].message.content
    save_message(request.session_id, "user", request.message)
    save_message(request.session_id, "assistant", answer)
    return {"response": answer}

# Mapping mots-clés → domaine exact en base de données
DOMAIN_KEYWORDS = {
    "management": "Management",
    "gestion": "Management",
    "agile": "Management",
    "scrum": "Management",
    "chef de projet": "Management",
    "data science": "Data Science",
    "données": "Data Science",
    "statistique": "Data Science",
    "machine learning": "Intelligence Artificielle",
    "intelligence artificielle": "Intelligence Artificielle",
    " ia ": "Intelligence Artificielle",
    "deep learning": "Intelligence Artificielle",
    "nlp": "Intelligence Artificielle",
    "web": "Développement Web",
    "frontend": "Développement Web",
    "react": "Développement Web",
    "design": "Design",
    "figma": "Design",
    "photoshop": "Design",
    "cybersécurité": "Cybersécurité",
    "cyber": "Cybersécurité",
    "sécurité": "Cybersécurité",
    "cloud": "Cloud et DevOps",
    "aws": "Cloud et DevOps",
    "devops": "Cloud et DevOps",
    "bases de données": "Bases de Données",
    "sql": "Bases de Données",
    "base de données": "Bases de Données",
    "bureautique": "Bureautique",
    "excel": "Bureautique",
    "informatique": "Informatique",
    "java": "Informatique",
    "python": "Intelligence Artificielle",
}

def get_formations_by_domain(domaine: str) -> list:
    """Récupère toutes les formations d'un domaine depuis PostgreSQL."""
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cur.execute(
            "SELECT id, title, description, domaine, niveau FROM formations WHERE domaine ILIKE %s",
            (domaine,)
        )
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return [dict(r) for r in rows]
    except Exception:
        return []

@app.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    history = get_history(request.session_id)

    history_text = ""
    for msg in history[-6:]:
        role = "Utilisateur" if msg["role"] == "user" else "Assistant"
        history_text += f"{role}: {msg['content']}\n"

    # Query ChromaDB with distances for RAG scores
    results = collection.query(
        query_texts=[request.message],
        n_results=5,
        include=["documents", "metadatas", "distances"]
    )

    context = ""
    rag_info = []
    seen_titles = set()
    MIN_SIMILARITY = 22.0  # seuil minimum pour considérer un résultat pertinent
    if results["documents"] and results["documents"][0]:
        for i, (doc, meta, dist) in enumerate(zip(
            results["documents"][0],
            results["metadatas"][0],
            results["distances"][0]
        )):
            similarity = round(max(0.0, (1.0 - (dist / 2.0))) * 100, 1)
            if similarity < MIN_SIMILARITY:
                continue
            title = meta.get("title", f"Formation {i+1}")
            context += f"\n--- Formation (similarité {similarity}%) ---\n{doc}\n"
            rag_info.append({"title": title, "document": doc[:120], "similarity": similarity})
            seen_titles.add(title)

    # ── Boost domaine : chercher aussi dans PostgreSQL si un domaine est détecté ──
    msg_lower = f" {request.message.lower()} "
    matched_domain = None
    for keyword, domain in DOMAIN_KEYWORDS.items():
        if keyword in msg_lower:
            matched_domain = domain
            break

    if matched_domain:
        domain_formations = get_formations_by_domain(matched_domain)
        for f in domain_formations:
            if f["title"] not in seen_titles:
                doc_text = f"{f['title']}\nDomaine: {f['domaine']}\nNiveau: {f['niveau'] or ''}\n{f['description'] or ''}"
                context += f"\n--- Formation (domaine exact: {matched_domain}) ---\n{doc_text}\n"
                rag_info.append({"title": f["title"], "document": doc_text[:120], "similarity": 35.0})
                seen_titles.add(f["title"])

    # Trier par similarité décroissante
    rag_info.sort(key=lambda x: x["similarity"], reverse=True)

    best_similarity = rag_info[0]["similarity"] if rag_info else 0

    if not context:
        async def error_gen():
            yield json.dumps({"rag_scores": []}) + "\n"
            yield json.dumps({"content": "Je n'ai trouvé aucune formation correspondant à votre recherche dans notre catalogue actuel. N'hésitez pas à reformuler ou explorer d'autres thèmes !"}) + "\n"
        return StreamingResponse(error_gen(), media_type="application/x-ndjson")

    # Instructions précises selon le niveau de similarité
    if best_similarity >= 60:
        relevance_instruction = "Les formations trouvées sont TRÈS PERTINENTES pour la question. Présente-les avec confiance et enthousiasme."
    elif best_similarity >= 40:
        relevance_instruction = "Les formations trouvées sont ASSEZ PERTINENTES. Présente-les en précisant en quoi elles répondent partiellement au besoin."
    else:
        relevance_instruction = f"Les formations trouvées ont une similarité modérée ({best_similarity}%). Sois honnête : précise que le catalogue ne contient pas de formation exactement sur ce sujet, mais que ces formations sont les plus proches disponibles."

    prompt = f"""Tu es un conseiller pédagogique expert de la plateforme BRN SMART.

Historique récent :
{history_text}

Formations disponibles dans le catalogue (avec leurs scores de pertinence) :
{context}

{relevance_instruction}

RÈGLES ABSOLUES :
- Ne dis JAMAIS "aucune formation ne traite de ce sujet" si des formations sont listées ci-dessus.
- Si une formation est listée, elle EXISTE dans notre catalogue — présente-la.
- Cite toujours le titre exact des formations que tu mentionnes.
- Sois naturel, chaleureux et concis (3-4 phrases max).

Question de l'utilisateur : {request.message}"""

    async def stream_generator():
        # First event: RAG scores
        yield json.dumps({"rag_scores": rag_info}) + "\n"

        full_response = ""
        stream = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "Tu es un conseiller pédagogique de BRN SMART. Tu recommandes des formations du catalogue fourni. Tu es honnête sur la pertinence des résultats."},
                {"role": "user", "content": prompt}
            ],
            stream=True
        )
        
        for chunk in stream:
            if chunk.choices and len(chunk.choices) > 0:
                delta = chunk.choices[0].delta
                if delta and delta.content:
                    content = delta.content
                    full_response += content
                    yield json.dumps({"content": content}) + "\n"
        
        save_message(request.session_id, "user", request.message)
        save_message(request.session_id, "assistant", full_response)
    
    return StreamingResponse(stream_generator(), media_type="application/x-ndjson")

@app.get("/chat/history/{session_id}")
def get_chat_history(session_id: str):
    history = get_history(session_id, limit=50)
    return {"session_id": session_id, "history": history}

@app.delete("/chat/history/{session_id}")
def delete_chat_history(session_id: str):
    clear_history(session_id)
    return {"message": f"Historique supprimé"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8007)