import React, { useState } from 'react';
import {
  Sparkles,
  Download,
  RotateCw,
  Copy,
  Check,
  Trash2,
  Maximize2,
  X,
  Palette,
  Ratio,
  Sliders,
  Image as ImageIcon,
  AlertCircle,
} from 'lucide-react';
import { GeneratedImage } from '../types/assistant';
import { api } from '../services/api';
import { AintLogo } from './AintLogo';

interface ImageStudioProps {
  images: GeneratedImage[];
  onSaveImage: (img: GeneratedImage) => void;
  onDeleteImage: (id: string) => void;
  onBackToChat: () => void;
}

const STYLE_PRESETS = [
  { id: 'cinematic', label: 'Cinematic', promptSuffix: 'cinematic lighting, 8k resolution, atmospheric movie still, detailed composition' },
  { id: 'photoreal', label: 'Photorealistic', promptSuffix: 'hyperrealistic photography, 35mm lens, natural soft lighting, high fidelity' },
  { id: 'cyberpunk', label: 'Cyberpunk Neon', promptSuffix: 'neon cyberpunk aesthetics, glowing holograms, dark reflective streets, volumetric lighting' },
  { id: 'minimalist3d', label: 'Minimalist 3D', promptSuffix: 'clean 3D render, smooth surfaces, pastel studio lighting, isometric aesthetic' },
  { id: 'anime', label: 'Anime Concept', promptSuffix: 'Japanese animation art style, vivid vibrant colors, dynamic anime studio concept' },
  { id: 'darkfantasy', label: 'Dark Fantasy', promptSuffix: 'moody dark fantasy oil painting, ethereal magic glowing, textured brushwork' },
];

const ASPECT_RATIOS = [
  { id: '1:1', label: 'Square (1:1)', desc: 'Avatar & Social' },
  { id: '16:9', label: 'Landscape (16:9)', desc: 'Hero & Display' },
  { id: '9:16', label: 'Portrait (9:16)', desc: 'Mobile Screen' },
  { id: '4:3', label: 'Standard (4:3)', desc: 'Card Graphic' },
  { id: '3:4', label: 'Tall (3:4)', desc: 'Poster' },
];

export const ImageStudio: React.FC<ImageStudioProps> = ({
  images,
  onSaveImage,
  onDeleteImage,
  onBackToChat,
}) => {
  const [prompt, setPrompt] = useState('');
  const [selectedRatio, setSelectedRatio] = useState<'1:1' | '16:9' | '9:16' | '4:3' | '3:4'>('1:1');
  const [selectedStyle, setSelectedStyle] = useState<string | null>('cinematic');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<GeneratedImage | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleGenerate = async (customPrompt?: string) => {
    const textPrompt = customPrompt || prompt;
    if (!textPrompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setError(null);

    const stylePresetObj = STYLE_PRESETS.find((s) => s.id === selectedStyle);

    try {
      const response = await api.generateImage({
        prompt: textPrompt.trim(),
        aspectRatio: selectedRatio,
        stylePreset: stylePresetObj?.promptSuffix,
      });

      const newImage: GeneratedImage = {
        id: `img-${Date.now()}`,
        prompt: textPrompt.trim(),
        aspectRatio: selectedRatio,
        stylePreset: stylePresetObj?.label,
        dataUrl: response.dataUrl,
        createdAt: Date.now(),
      };

      onSaveImage(newImage);
      setPreviewImage(newImage);
    } catch (err: any) {
      console.error('Image Studio error:', err);
      setError(err.message || 'Image generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = (dataUrl: string, promptText: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    const cleanName = promptText.slice(0, 25).replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.download = `aint_ai_${cleanName}_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyPrompt = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#080a11] text-slate-100 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
      {/* Studio Header */}
      <div className="px-6 py-4 border-b border-slate-800/80 bg-[#090d18]/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-400 p-1.5">
            <AintLogo className="w-full h-full text-violet-400" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white flex items-center gap-2">
              Ain't Image Studio
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-sm bg-violet-500/20 text-violet-300 border border-violet-500/30">
                Gemini Vector Illustrator
              </span>
            </h1>
            <p className="text-xs text-slate-400">Generates custom vector artwork and illustrations directly tailored to your prompt</p>
          </div>
        </div>

        <button
          onClick={onBackToChat}
          className="px-3 py-1.5 rounded-xl border border-slate-800 hover:bg-slate-850 text-xs font-medium text-slate-300 transition-colors"
        >
          Return to Chat
        </button>
      </div>

      <div className="max-w-6xl mx-auto w-full p-4 md:p-6 space-y-6">
        {/* Creator Panel */}
        <div className="p-5 rounded-2xl bg-[#0f1424] border border-slate-800/90 shadow-xl space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Image Description Prompt
            </label>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the image you want to generate in detail (e.g. A serene mountain sanctuary nestled in violet mist with glowing lanterns at dusk, photorealistic, 8k)..."
              className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-violet-500/60 leading-relaxed"
            />
          </div>

          {/* Style Presets */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-2">
              <Palette className="w-3.5 h-3.5 text-violet-400" />
              <span>Aesthetic Style Preset</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {STYLE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => setSelectedStyle(selectedStyle === preset.id ? null : preset.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    selectedStyle === preset.id
                      ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30 border border-violet-500'
                      : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-850'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Aspect Ratio Selector */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-2">
              <Ratio className="w-3.5 h-3.5 text-indigo-400" />
              <span>Aspect Ratio</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {ASPECT_RATIOS.map((ratio) => (
                <button
                  key={ratio.id}
                  onClick={() => setSelectedRatio(ratio.id as any)}
                  className={`p-2.5 rounded-xl text-left border transition-all ${
                    selectedRatio === ratio.id
                      ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-xs'
                      : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-semibold text-slate-200">{ratio.label}</div>
                  <div className="text-[10px] text-slate-500">{ratio.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className={`flex items-start gap-2.5 p-3.5 rounded-xl text-xs ${
              error.includes('429') || error.toLowerCase().includes('quota')
                ? 'bg-amber-950/40 border border-amber-600/40 text-amber-200'
                : 'bg-rose-950/40 border border-rose-800 text-rose-300'
            }`}>
              <AlertCircle className={`w-4 h-4 shrink-0 mt-0.5 ${
                error.includes('429') || error.toLowerCase().includes('quota') ? 'text-amber-400' : 'text-rose-400'
              }`} />
              <div className="space-y-1">
                <div className="font-semibold">
                  {error.includes('429') || error.toLowerCase().includes('quota')
                    ? 'Gemini Image Generation Quota Limit'
                    : 'Generation Failed'}
                </div>
                <div className="leading-relaxed">{error}</div>
              </div>
            </div>
          )}

          {/* Submit Action */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-slate-500">
              Powered by Google GenAI image generation
            </span>

            <button
              onClick={() => handleGenerate()}
              disabled={!prompt.trim() || isGenerating}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold shadow-lg shadow-violet-600/30 transition-all active:scale-[0.98]"
            >
              {isGenerating ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Image...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Original Image</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Gallery / History */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-violet-400" />
              Creation Gallery ({images.length})
            </h2>
            <span className="text-xs text-slate-500">Click any image to view high-res</span>
          </div>

          {images.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-[#0a0d18]/50 space-y-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 mx-auto text-slate-500">
                <ImageIcon className="w-6 h-6" />
              </div>
              <p className="text-sm text-slate-400">No images generated yet.</p>
              <p className="text-xs text-slate-500">Type a prompt above and create your first original visual asset!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {images.map((img) => (
                <div
                  key={img.id}
                  className="group relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 hover:border-violet-500/50 transition-all shadow-md flex flex-col"
                >
                  <div
                    className="relative aspect-square overflow-hidden bg-slate-950 cursor-pointer"
                    onClick={() => setPreviewImage(img)}
                  >
                    <img
                      src={img.dataUrl}
                      alt={img.prompt}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                      <span className="text-xs text-white flex items-center gap-1 font-medium">
                        <Maximize2 className="w-3.5 h-3.5" /> Enlarge
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                      {img.prompt}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                      <span className="px-1.5 py-0.5 rounded-sm bg-slate-800 font-mono text-[10px]">
                        {img.aspectRatio || '1:1'}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => copyPrompt(img.prompt, img.id)}
                          className="p-1.5 hover:text-white rounded-md transition-colors"
                          title="Copy prompt"
                        >
                          {copiedId === img.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => {
                            setPrompt(img.prompt);
                            handleGenerate(img.prompt);
                          }}
                          className="p-1.5 hover:text-violet-300 rounded-md transition-colors"
                          title="Regenerate this prompt"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => downloadImage(img.dataUrl, img.prompt)}
                          className="p-1.5 hover:text-sky-400 rounded-md transition-colors"
                          title="Download PNG"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteImage(img.id)}
                          className="p-1.5 hover:text-rose-400 rounded-md transition-colors"
                          title="Delete image"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* High-Resolution Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col rounded-2xl bg-[#0e121e] border border-slate-800 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <div className="truncate pr-4">
                <h3 className="text-sm font-semibold text-white truncate">{previewImage.prompt}</h3>
                <p className="text-xs text-slate-400 font-mono">
                  Aspect: {previewImage.aspectRatio || '1:1'} • {new Date(previewImage.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setPreviewImage(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-black/40">
              <img
                src={previewImage.dataUrl}
                alt={previewImage.prompt}
                className="max-h-[65vh] object-contain rounded-xl shadow-2xl"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="p-4 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => copyPrompt(previewImage.prompt, 'preview')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-850 hover:bg-slate-800 text-xs font-medium text-slate-200 transition-colors"
              >
                {copiedId === 'preview' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>Copy Prompt</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setPrompt(previewImage.prompt);
                    setPreviewImage(null);
                    handleGenerate(previewImage.prompt);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-violet-600/30 hover:bg-violet-600/40 border border-violet-500/40 text-violet-200 text-xs font-medium transition-colors"
                >
                  <RotateCw className="w-4 h-4" />
                  <span>Regenerate</span>
                </button>
                <button
                  onClick={() => downloadImage(previewImage.dataUrl, previewImage.prompt)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Image</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
