"""
Tests unitaires — service-3-ia (Random Forest Profilage)
Lancer : pytest test_app.py -v
"""
import pytest
import json
from app import app


@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client


# ── /predict — cas valides ───────────────────────────────────────────────────

def test_predict_retourne_un_groupe(client):
    payload = {
        "niveau":        "Intermédiaire",
        "rythme":        "modéré",
        "objectif":      "Apprentissage",
        "disponibilite": "moyenne"
    }
    response = client.post('/predict',
                           data=json.dumps(payload),
                           content_type='application/json')
    assert response.status_code == 200
    data = response.get_json()
    assert 'groupe' in data
    assert data['groupe'] in ['bas', 'intermediaire', 'haut']


def test_predict_debutant_retourne_groupe(client):
    payload = {
        "niveau":        "Débutant",
        "rythme":        "lent",
        "objectif":      "Révision",
        "disponibilite": "faible"
    }
    response = client.post('/predict',
                           data=json.dumps(payload),
                           content_type='application/json')
    assert response.status_code == 200
    data = response.get_json()
    assert 'groupe' in data


def test_predict_avance_retourne_groupe(client):
    payload = {
        "niveau":        "Avancé",
        "rythme":        "rapide",
        "objectif":      "Perfectionnement",
        "disponibilite": "élevée"
    }
    response = client.post('/predict',
                           data=json.dumps(payload),
                           content_type='application/json')
    assert response.status_code == 200
    data = response.get_json()
    assert 'groupe' in data
    assert 'probabilites' in data


# ── /predict — cas invalides ─────────────────────────────────────────────────

def test_predict_champs_manquants_retourne_erreur(client):
    payload = {"niveau": "Débutant"}  # champs manquants
    response = client.post('/predict',
                           data=json.dumps(payload),
                           content_type='application/json')
    assert response.status_code in [400, 500]


def test_predict_body_vide_retourne_erreur(client):
    response = client.post('/predict',
                           data='{}',
                           content_type='application/json')
    assert response.status_code in [400, 500]


def test_predict_methode_get_non_autorisee(client):
    response = client.get('/predict')
    assert response.status_code == 405


# ── / health check ───────────────────────────────────────────────────────────

def test_root_retourne_200(client):
    response = client.get('/')
    assert response.status_code == 200
