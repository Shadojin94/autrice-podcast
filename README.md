# Projet Podcast - Générateur de Podcasts IA

Ce projet permet de générer des podcasts audio à partir d'un sujet défini et des interlocuteurs choisis (H/F, H/H, F/F). Le backend génère un script avec l'IA, le convertit en audio et renvoie le fichier MP3.

## Fonctionnalités

- Interface utilisateur intuitive pour la création de podcasts
- Sélection du sujet, de la langue et du type d'interlocuteurs
- Génération de dialogue via l'IA
- Conversion du texte en audio avec synthèse vocale OpenAI
- Téléchargement du fichier MP3 généré
- Affichage de la transcription du podcast

## Structure du projet

Le projet est divisé en deux parties principales :

- **Frontend** : Application React avec Vite et TypeScript
- **Backend** : API NestJS avec intégration OpenAI pour la synthèse vocale

## Prérequis

- Node.js (v16+)
- npm ou yarn
- Clé API OpenAI valide

## Installation

1. Cloner le dépôt
```bash
git clone <url-du-repo>
cd Podcast
```

2. Installer les dépendances du backend
```bash
cd backend
npm install
```

3. Configurer les variables d'environnement
```bash
cp .env.example .env
# Modifier le fichier .env avec votre clé API OpenAI
```

4. Installer les dépendances du frontend
```bash
cd ../frontend
npm install
```

## Démarrage

1. Démarrer le backend
```bash
cd Podcast/backend
npm run start:dev
```

2. Démarrer le frontend (dans un autre terminal)
```bash
cd Podcast/frontend
npm run dev
```

3. Accéder à l'application dans votre navigateur à l'adresse http://localhost:5173

## Notes techniques

- Le backend utilise le port 3001 par défaut (configurable dans .env)
- Le frontend utilise le port 5173 par défaut
- La synthèse vocale utilise l'API OpenAI TTS (Text-to-Speech)
- Les voix utilisées sont "alloy" et "nova" pour différencier les interlocuteurs

## Dépannage

- Si vous rencontrez des erreurs de connexion, vérifiez que les deux serveurs sont bien démarrés
- Vérifiez que la clé API OpenAI est valide et a accès au modèle TTS-1
- Assurez-vous que le proxy dans vite.config.ts pointe vers le bon port du backend
