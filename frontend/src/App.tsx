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
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [transcriptionResult, setTranscriptionResult] = useState<string>('');
  const [transcribing, setTranscribing] = useState<boolean>(false);

  const handleTopicChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTopic(e.target.value);
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value);
  };

  const handleSpeakersChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSpeakers(e.target.value);
  };

  const generateScript = (topic: string, speakers: string, language: string): string => {
    // Déterminer les préfixes de locuteurs en fonction du type d'interlocuteurs
    let speaker1 = 'Speaker R';
    let speaker2 = 'Speaker S';
    
    // Structure complète du podcast
    return `${speaker1}: Bonjour à tous et bienvenue dans ce nouvel épisode de notre podcast. Aujourd'hui, nous allons parler de ${topic}, un sujet fascinant qui mérite d'être exploré en profondeur.

${speaker2}: Tout à fait ! Ce sujet est particulièrement d'actualité et suscite beaucoup d'intérêt. Nous allons vous présenter les différents aspects et enjeux liés à ${topic}.

${speaker1}: Pour commencer, mettons en contexte ce sujet. ${topic} est un domaine qui touche de nombreux aspects de notre société moderne.

${speaker2}: Exactement. Et pour mieux comprendre, posons-nous quelques questions essentielles. Tout d'abord, qu'entend-on exactement par ${topic} ? Quelles sont ses caractéristiques principales ?

${speaker1}: ${topic} peut être défini comme un ensemble de concepts et pratiques qui transforment notre façon de voir et d'interagir avec le monde. Les origines remontent à plusieurs années, mais c'est récemment que ce sujet a pris une ampleur considérable.

${speaker2}: Si nous analysons plus en profondeur, quels sont les impacts de ${topic} sur notre quotidien et sur les différents secteurs d'activité ?

${speaker1}: Excellente question ! ${topic} influence de nombreux domaines comme l'économie, la technologie, et même nos interactions sociales. Par exemple, nous observons des changements significatifs dans la manière dont les entreprises abordent leurs stratégies.

${speaker2}: Et si nous nous projetons dans l'avenir, comment voyez-vous l'évolution de ${topic} dans les cinq prochaines années ? Quelles tendances émergentes pouvons-nous anticiper ?

${speaker1}: Les experts prévoient une accélération des innovations liées à ${topic}. Nous pourrions voir émerger de nouvelles applications et des usages que nous n'imaginons pas encore aujourd'hui.

${speaker2}: Abordons maintenant un aspect crucial : les questions éthiques et les défis liés à ${topic}. Quels sont les risques potentiels et comment pouvons-nous les atténuer ?

${speaker1}: C'est un point essentiel. Tout progrès s'accompagne de responsabilités. Nous devons être vigilants concernant les questions de confidentialité, d'équité et d'accessibilité liées à ${topic}.

${speaker2}: Pour illustrer concrètement, prenons un exemple de mise en application réussie de ${topic} dans un contexte réel.

${speaker1}: Une étude de cas intéressante est celle de [exemple fictif adapté au sujet]. Cette initiative a démontré comment ${topic} peut être utilisé de manière innovante et responsable.

${speaker2}: Pour conclure cet épisode, récapitulons les points clés que nous avons abordés sur ${topic}.

${speaker1}: Nous avons exploré la définition et le contexte de ${topic}, analysé ses impacts sur différents secteurs, anticipé les évolutions futures, et discuté des enjeux éthiques. 

${speaker2}: Nous espérons que cette discussion vous aura éclairés et donnés envie d'aller plus loin dans l'exploration de ${topic}. N'hésitez pas à partager vos réflexions ou vos questions.

${speaker1}: Merci de nous avoir écoutés, et nous vous donnons rendez-vous très bientôt pour un nouvel épisode tout aussi passionnant !`;
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
      // Générer un script basé sur le sujet, les interlocuteurs et la langue
      const generatedScript = generateScript(topic, speakers, language);
      setTranscript(generatedScript);

      // Envoyer au backend pour synthèse vocale
      const response = await fetch('/api/tts/synthesize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          script: generatedScript,
          speakerType: speakers,
          language: language
        }),
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

  const handleTranscribe = async () => {
    if (!audioFile) {
      setError('Veuillez sélectionner un fichier audio à transcrire');
      return;
    }

    setTranscribing(true);
    setError(null);
    setTranscriptionResult('');

    try {
      const formData = new FormData();
      formData.append('file', audioFile);

      const response = await fetch('/api/tts/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Échec de la transcription audio');
      }

      const data = await response.json();
      setTranscriptionResult(data.transcription);
      
      // Optionnel : utiliser la transcription comme script pour le podcast
      if (data.transcription) {
        setTranscript(data.transcription);
        setShowTranscript(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur inconnue est survenue');
    } finally {
      setTranscribing(false);
    }
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
        
        <section className="transcription-section">
          <h3 className="section-title">Transcription Audio avec GPT-4o Mini Audio</h3>
          
          <div className="transcription-form">
            <div className="form-group">
              <label htmlFor="audio-file">Fichier Audio</label>
              <input
                type="file"
                id="audio-file"
                accept="audio/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    setAudioFile(e.target.files[0]);
                    setError(null);
                  }
                }}
                className="file-input"
              />
              <small className="file-help">Formats supportés: MP3, WAV, M4A, etc.</small>
            </div>
            
            <button 
              className="generate-button" 
              onClick={handleTranscribe}
              disabled={transcribing || !audioFile}
            >
              <span className="icon">🎤</span> {transcribing ? 'Transcription en cours...' : 'Transcrire l\'Audio'}
            </button>
            
            {transcriptionResult && (
              <div className="transcription-result">
                <h4>Résultat de la Transcription</h4>
                <pre className="transcription-text">{transcriptionResult}</pre>
                <p className="transcription-info">La transcription a été automatiquement ajoutée comme script de podcast.</p>
              </div>
            )}
          </div>
        </section>
        
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
