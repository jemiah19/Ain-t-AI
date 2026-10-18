// Speech Recognition & Text-to-Speech service for Ain't AI

export interface SpeechRecognitionHandlers {
  onResult: (transcript: string, isFinal: boolean) => void;
  onError: (error: string) => void;
  onEnd: () => void;
  onStart: () => void;
}

export class VoiceService {
  private recognition: any = null;
  private isListening: boolean = false;
  private currentAudio: HTMLAudioElement | null = null;

  constructor() {
    this.initRecognition();
  }

  public isSpeechRecognitionSupported(): boolean {
    return typeof window !== 'undefined' &&
      ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
  }

  private initRecognition() {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
    }
  }

  public startListening(handlers: SpeechRecognitionHandlers): boolean {
    if (!this.recognition) {
      this.initRecognition();
    }

    if (!this.recognition) {
      handlers.onError('Speech recognition is not supported in this browser.');
      return false;
    }

    try {
      this.recognition.onstart = () => {
        this.isListening = true;
        handlers.onStart();
      };

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        const text = finalTranscript || interimTranscript;
        handlers.onResult(text, Boolean(finalTranscript));
      };

      this.recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          handlers.onError('Microphone permission denied. Please allow microphone access in your browser.');
        } else if (event.error !== 'no-speech') {
          handlers.onError(`Voice input error: ${event.error}`);
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;
        handlers.onEnd();
      };

      this.recognition.start();
      return true;
    } catch (err: any) {
      handlers.onError(err.message || 'Failed to start microphone');
      return false;
    }
  }

  public stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch {
        // ignore
      }
      this.isListening = false;
    }
  }

  public stopSpeaking() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  public playBase64Audio(base64Audio: string, mimeType: string = 'audio/wav'): Promise<void> {
    this.stopSpeaking();

    return new Promise((resolve, reject) => {
      try {
        const audioSrc = `data:${mimeType};base64,${base64Audio}`;
        const audio = new Audio(audioSrc);
        this.currentAudio = audio;

        audio.onended = () => {
          this.currentAudio = null;
          resolve();
        };

        audio.onerror = (err) => {
          this.currentAudio = null;
          reject(err);
        };

        audio.play().catch(reject);
      } catch (err) {
        reject(err);
      }
    });
  }

  public speakBrowserFallback(text: string): Promise<void> {
    this.stopSpeaking();

    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        reject(new Error('Browser speech synthesis is not supported'));
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      utterance.onend = () => resolve();
      utterance.onerror = (e) => reject(e);

      window.speechSynthesis.speak(utterance);
    });
  }
}

export const voiceService = new VoiceService();
