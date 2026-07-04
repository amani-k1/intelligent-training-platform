from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import numpy as np
import os

app = Flask(__name__)
_allowed = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
CORS(app, origins=[o.strip() for o in _allowed])

# Charger le modèle et les encodeurs
with open('modele_random_forest_ameliore.pkl', 'rb') as f:
    data = pickle.load(f)

model = data['model']
enc_niveau = data['enc_niveau']
enc_rythme = data['enc_rythme']
enc_objectif = data['enc_objectif']
enc_dispo = data['enc_dispo']
enc_groupe = data['enc_groupe']

print("Catégories niveau :", enc_niveau.categories_)
print("Catégories rythme :", enc_rythme.categories_)
print("Catégories objectif :", enc_objectif.categories_)
print("Catégories disponibilité :", enc_dispo.categories_)

@app.route('/predict', methods=['POST'])
def predict():
    try:
        req = request.get_json()
        # Encodage des entrées
        niv = enc_niveau.transform([[req['niveau']]])[0][0]
        ryth = enc_rythme.transform([[req['rythme']]])[0][0]
        obj = enc_objectif.transform([[req['objectif']]])[0][0]
        disp = enc_dispo.transform([[req['disponibilite']]])[0][0]

        X = np.array([[niv, ryth, obj, disp]])
        pred = model.predict(X)[0]
        probas = model.predict_proba(X)[0]
        groupe = enc_groupe.inverse_transform([[pred]])[0][0]
        # Normalise le typo présent dans certains modèles entraînés
        if groupe == 'intermediare':
            groupe = 'intermediaire'

        return jsonify({
            'groupe': groupe,
            'probabilites': {
                'bas': float(probas[0]),
                'intermediaire': float(probas[1]),
                'haut': float(probas[2])
            }
        })
    except Exception as e:
        print("ERREUR:", str(e))
        return jsonify({'erreur': str(e)}), 400

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=False)