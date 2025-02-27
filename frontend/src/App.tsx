import { useState } from 'react';
import './App.css';

function App() {
  const [topic, setTopic] = useState<string>('');
  const [language, setLanguage] = useState<string>('Français');
  const [speakers, setSpeakers] = useState<string>('Homme & Homme');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showTranscript, setShowTranscript] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');

  const handleTopicChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTopic(e.target.value);
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value);
  };

  const handleSpeakersChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSpeakers(e.target.value);
  };

  const generateScript = (topic: string, speakers: string): string => {
    // Format pour le backend
    let speakerPrefix = '';
    
    if (speakers === 'Homme & Homme') {
      speakerPrefix = 'Speaker R: ';
    } else if (speakers === 'Femme & Femme') {
      speakerPrefix = 'Speaker S: ';
    } else {
      // Homme & Femme - alternance
      speakerPrefix = 'Speaker R: ';
    }
    
    return `${speakerPrefix}Bienvenue à ce podcast sur ${topic}. Aujourd'hui nous allons discuter de ce sujet passionnant.
Speaker S: Oui, c'est un sujet très intéressant. Commençons par explorer les différents aspects.`;
  };

  const handleGeneratePodcast = async () => {
    if (!topic.trim()) {
      setError('Veuillez entrer un sujet pour le podcast');
      return;
    }

    setLoading(true);
    setError(null);
    setAudioUrl(null);
    setShowTranscript(false);

    try {
      // Générer un script basé sur le sujet et les interlocuteurs
      const generatedScript = generateScript(topic, speakers);
      setTranscript(generatedScript);

      // Envoyer au backend pour synthèse vocale
      const response = await fetch('/api/tts/synthesize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ script: generatedScript }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Échec de la génération du podcast');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur inconnue est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (audioUrl) {
      const a = document.createElement('a');
      a.href = audioUrl;
      a.download = `podcast-${topic.substring(0, 20)}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const toggleTranscript = () => {
    setShowTranscript(!showTranscript);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">AUDIVA</h1>
        <nav className="app-nav">
          <a href="#" className="nav-link">Créer des podcasts</a>
          <div className="auth-links">
            <a href="#" className="auth-link">Créer un compte</a>
            <a href="#" className="auth-button">Me connecter</a>
          </div>
        </nav>
      </header>

      <main className="main-content">
        <h2 className="main-title">Générez des podcasts interactifs<br />avec notre IA conversationnelle</h2>
        
        <section className="podcast-creator">
          <h3 className="section-title">Expérience concepteur</h3>
          
          <div className="creator-form">
            <div className="form-group">
              <label htmlFor="topic">Sujet du Podcast</label>
              <textarea
                id="topic"
                value={topic}
                onChange={handleTopicChange}
                rows={4}
                placeholder="Entrez le sujet de votre podcast..."
              />
            </div>
            
            <div className="form-row">
              <div className="form-group half">
                <label htmlFor="language">
                  <span className="icon">🌐</span> Langue
                </label>
                <select 
                  id="language" 
                  value={language}
                  onChange={handleLanguageChange}
                >
                  <option value="Français">Français</option>
                  <option value="English">English</option>
                  <option value="Español">Español</option>
                </select>
              </div>
              
              <div className="form-group half">
                <label htmlFor="speakers">
                  <span className="icon">👥</span> Intervenants
                </label>
                <select 
                  id="speakers" 
                  value={speakers}
                  onChange={handleSpeakersChange}
                >
                  <option value="Homme & Homme">Homme & Homme</option>
                  <option value="Homme & Femme">Homme & Femme</option>
                  <option value="Femme & Femme">Femme & Femme</option>
                </select>
              </div>
            </div>
            
            <button 
              className="generate-button" 
              onClick={handleGeneratePodcast}
              disabled={loading || !topic.trim()}
            >
              <span className="icon">🎙️</span> Générer le Podcast
            </button>
          </div>
        </section>
        
        {error && <div className="error-message">{error}</div>}
        
        {audioUrl && (
          <div className="podcast-result">
            <h3>Votre Podcast</h3>
            <audio controls src={audioUrl} className="audio-player" />
            
            <div className="action-buttons">
              <button className="action-button download-button" onClick={handleDownload}>
                Télécharger
              </button>
              <button className="action-button transcript-button" onClick={toggleTranscript}>
                {showTranscript ? 'Masquer la transcription' : 'Afficher la transcription'}
              </button>
            </div>
            
            {showTranscript && (
              <div className="transcript-container">
                <h4>Transcription</h4>
                <pre className="transcript-text">{transcript}</pre>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
