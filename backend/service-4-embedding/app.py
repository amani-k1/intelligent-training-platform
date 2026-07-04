from flask import Flask, request, jsonify
from sentence_transformers import SentenceTransformer, util
import psycopg2
import os
import unicodedata
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(__file__), '../service-2/.env')
load_dotenv(env_path)

app = Flask(__name__)

print("Chargement du modèle d'embedding multilingue...")
model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
print("Modèle chargé.")

SEUIL            = 0.70   # formation existe avec haute confiance (70%)
SEUIL_SUGGESTION = 0.50   # suggestion affichée seulement si ≥ 50% similaire

# Mots vides français à ignorer dans la requête
STOP_WORDS = {
    'je', 'tu', 'il', 'elle', 'nous', 'vous', 'ils', 'elles',
    'me', 'te', 'se', 'le', 'la', 'les', 'un', 'une', 'des',
    'de', 'du', 'au', 'aux', 'en', 'et', 'ou', 'a', 'y',
    'veux', 'voudrais', 'aimerais', 'cherche', 'recherche',
    'apprendre', 'comprendre', 'faire', 'savoir', 'trouver',
    'quelque', 'chose', 'sur', 'pour', 'avec', 'dans', 'par',
    'comment', 'quoi', 'quel', 'quelle', 'quels', 'quelles',
    'est', 'sont', 'avoir', 'etre', 'formation', 'cours', 'module',
    'plus', 'bien', 'bon', 'bonne', 'meilleur', 'besoin',
}

# Abréviations + synonymes du domaine tech → expansion sémantique
ABREVIATIONS = {
    # Abréviations classiques
    'ia':       'intelligence artificielle machine learning',
    'ai':       'artificial intelligence machine learning intelligence artificielle',
    'ml':       'machine learning apprentissage automatique intelligence artificielle',
    'dl':       'deep learning reseau neurones apprentissage profond',
    'nlp':      'traitement langage naturel texte analyse',
    'bdd':      'base donnees sql postgresql',
    'bd':       'base donnees sql postgresql',
    'js':       'javascript web frontend react nodejs',
    'py':       'python programmation data science',
    'ts':       'typescript javascript web frontend',
    'ux':       'experience utilisateur design interface',
    'ui':       'interface utilisateur design web',
    'rh':       'ressources humaines management',
    'sql':      'base donnees requetes postgresql mysql',
    'aws':      'cloud amazon infrastructure devops',
    'dev':      'developpement programmation',
    'cv':       'computer vision image deep learning',
    # Mots techniques → domaine élargi
    'html':     'html css javascript web frontend developpement react interface',
    'css':      'css html design web frontend style interface javascript',
    'react':    'react javascript frontend web application composants spa',
    'angular':  'angular typescript javascript frontend web spa',
    'vue':      'vue javascript frontend web spa application',
    'nodejs':   'nodejs javascript backend serveur api web',
    'python':   'python programmation script data science machine learning',
    'java':     'java programmation orientee objet backend spring',
    'docker':   'docker conteneur cloud devops deploiement infrastructure',
    'cloud':    'cloud aws azure devops infrastructure deploiement',
    'api':      'api rest web service integration backend',
    'git':      'git version controle developpement collaboration',
    'linux':    'linux systeme administration serveur reseau',
    'agile':    'agile scrum gestion projet sprint',
    'scrum':    'scrum agile gestion projet methode sprint',
    'design':   'design ux ui interface graphique web photoshop',
    'data':     'data science analyse donnees statistiques machine learning',
    'reseau':   'reseau linux infrastructure systeme administration',
    'securite': 'cybersecurite protection donnees securite informatique',
    'finance':  'finance comptabilite gestion budget analyse',
    'excel':    'excel tableur analyse donnees finance statistiques',
    # Frameworks Python
    'flask':    'flask python web backend api rest framework developpement',
    'django':   'django python web backend framework developpement',
    'fastapi':  'fastapi python web api rest backend framework',
    'pandas':   'pandas python data science analyse donnees',
    'numpy':    'numpy python calcul scientifique data science',
    'sklearn':  'scikit-learn python machine learning algorithmes',
    'tensorflow': 'tensorflow deep learning reseau neurones python',
    'pytorch':  'pytorch deep learning reseau neurones python',
    # Frameworks JS
    'vuejs':    'vue javascript frontend web spa application',
    'nextjs':   'next javascript react web fullstack',
    'express':  'express nodejs javascript backend api web',
    'spring':   'spring java backend framework web',
    'laravel':  'laravel php web backend framework',
    # Autres outils
    'kubernetes': 'kubernetes docker orchestration cloud devops deploiement',
    'k8s':      'kubernetes docker orchestration cloud devops',
    'ci':       'integration continue devops automatisation deploiement',
    'devops':   'devops docker kubernetes cloud automatisation deploiement',
    'mongodb':  'mongodb base donnees nosql backend',
    'mysql':    'mysql base donnees sql requetes',
    'php':      'php web backend developpement laravel',
}


def normalize(text):
    """Minuscules + suppression des accents."""
    text = text.lower().strip()
    text = unicodedata.normalize('NFKD', text)
    return ''.join(c for c in text if not unicodedata.combining(c))


def expand_abbreviations(text):
    """Supprime les mots vides + remplace les abréviations par leur forme complète."""
    norm = normalize(text)
    mots = norm.split()
    expanded = []
    for mot in mots:
        if mot in STOP_WORDS:
            continue
        if mot in ABREVIATIONS:
            expanded.append(ABREVIATIONS[mot])
        else:
            expanded.append(mot)
    # Si tout a été supprimé, garder le texte original normalisé
    return ' '.join(expanded) if expanded else norm


def keyword_boost(query_originale_norm, query_elargie_norm, titre, description):
    """
    Bonus si des mots de la requête (originale OU élargie) apparaissent
    dans le titre/description. Utiliser les deux formes permet de matcher
    à la fois les abréviations ('ia' dans 'l'IA') et les formes complètes
    ('intelligence' dans 'Intelligence Artificielle').
    """
    mots_orig    = {w for w in query_originale_norm.split() if len(w) >= 2}
    mots_elargis = {w for w in query_elargie_norm.split()   if len(w) >  2}
    tous_mots = mots_orig | mots_elargis
    if not tous_mots:
        return 0.0
    cible = normalize(titre + ' ' + (description or ''))
    correspondances = sum(1 for mot in tous_mots if mot in cible)
    return correspondances / len(tous_mots)


def get_formations():
    conn = psycopg2.connect(
        host=os.getenv('DB_HOST', 'db'),
        port=os.getenv('DB_PORT', '5432'),
        dbname=os.getenv('DB_DATABASE', 'ma_formation'),
        user=os.getenv('DB_USER', 'postgres'),
        password=os.getenv('DB_PASSWORD', 'useradmin')
    )
    cur = conn.cursor()
    cur.execute("SELECT title, description FROM app.formations;")
    rows = cur.fetchall()
    cur.close()
    conn.close()

    formations = []
    for title, description in rows:
        desc = (description or '').strip()
        # Titre répété 2× pour lui donner plus de poids dans l'embedding
        texte_enrichi = f"{title} {title} {desc}" if desc else f"{title} {title}"
        formations.append({
            'titre':       title,
            'description': desc,
            'texte':       texte_enrichi,
        })
    return formations


@app.route('/detect', methods=['POST'])
def detect():
    data = request.get_json()
    requete = data.get('requete', '').strip()
    if not requete:
        return jsonify({'error': 'Requête vide'}), 400

    formations = get_formations()
    if not formations:
        return jsonify({'error': 'Aucune formation en base de données'}), 404

    textes = [f['texte'] for f in formations]
    titres = [f['titre'] for f in formations]

    # Expansion des abréviations avant encoding
    requete_elargie = expand_abbreviations(requete)

    # Scores sémantiques
    formation_embeddings = model.encode(textes, convert_to_tensor=True)
    query_emb            = model.encode(requete_elargie, convert_to_tensor=True)
    semantic_scores      = util.cos_sim(query_emb, formation_embeddings)[0].tolist()

    # Score final = sémantique + boost mots-clés (max +0.20)
    requete_orig_norm   = normalize(requete)          # "ia"
    requete_elargie_norm = normalize(requete_elargie) # "intelligence artificielle"
    scores_finaux = []
    for i, (sem, f) in enumerate(zip(semantic_scores, formations)):
        boost = keyword_boost(requete_orig_norm, requete_elargie_norm, f['titre'], f['description'])
        score = min(1.0, float(sem) + 0.20 * boost)
        scores_finaux.append((i, round(score, 4)))

    # Trier du meilleur au moins bon
    scores_finaux.sort(key=lambda x: x[1], reverse=True)

    top_k   = min(8, len(formations))
    top_res = scores_finaux[:top_k]

    best_idx, best_score = top_res[0]
    best_match = titres[best_idx]
    existe     = best_score >= SEUIL

    formations_proches = []
    for rank, (idx, score) in enumerate(top_res):
        # Toujours inclure le meilleur (pour l'enregistrement alerte admin)
        # + formations avec similarité ≥ 50% uniquement
        if rank == 0 or score >= SEUIL_SUGGESTION:
            formations_proches.append({
                'titre':      titres[idx],
                'similarite': score,
            })

    return jsonify({
        'requete':            requete,
        'existe':             existe,
        'similarite':         best_score,
        'formation_proche':   best_match,
        'formations_proches': formations_proches,
    })


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002, debug=False)
