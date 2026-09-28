export type LanguageCode = 'ur' | 'en' | 'hi' | 'ar';

export interface Language {
  code: LanguageCode;
  name: string;
  nativeName: string;
  flag: string;
  dir: 'ltr' | 'rtl';
  fontClass: string;
}

export interface VoiceOption {
  id: string;
  name: string;
  gender: 'female' | 'male';
  tone: string;
  role: string;
  description: string;
  tags: string[];
}

export interface GeneratedAudioItem {
  id: string;
  text: string;
  language: LanguageCode;
  voiceName: string;
  speed: number;
  pitch: number;
  style?: string;
  audioUrl: string;
  audioBase64: string;
  mimeType: string;
  duration?: number;
  createdAt: number;
}

export interface SampleScript {
  id: string;
  title: string;
  category: string;
  language: LanguageCode;
  text: string;
}
