import React from 'react';
import { Image as ImageIcon, Headphones, Video as VideoIcon, CheckCircle2, Check } from 'lucide-react';
import { Card } from '../ui/Card';

export const SupportedMedia: React.FC = () => {
  const mediaTypes = [
    {
      id: 'image',
      emoji: '🖼️',
      name: 'Image',
      title: 'Image Forensics',
      icon: ImageIcon,
      formats: ['JPG', 'JPEG', 'PNG', 'WEBP'],
      status: 'Forensic Engine Active',
      accent: 'border-pink-500/30 text-pink-400',
      description:
        'Analyzes generative pixel patterns, spatial noise consistency across quadrants, dynamic range clipping, and EXIF/PNG parameters.',
      plannedCapabilities: [
        'Spatial quadrant noise variance analysis',
        'Luminance & RMS contrast dynamics',
        'EXIF header & PNG parameter extraction',
      ],
    },
    {
      id: 'audio',
      emoji: '🎧',
      name: 'Audio',
      title: 'Audio Forensics',
      icon: Headphones,
      formats: ['MP3', 'WAV', 'M4A', 'OGG'],
      status: 'Forensic Engine Active',
      accent: 'border-fuchsia-500/30 text-fuchsia-400',
      description:
        'Inspects acoustic waveforms, brickwall frequency cutoffs, silence distribution, digital clipping, and zero-crossing rate dynamics.',
      plannedCapabilities: [
        'High-frequency brickwall cutoff detection',
        'RMS power & crest factor amplitude dynamics',
        'Conversational pause & silence ratios',
      ],
    },
    {
      id: 'video',
      emoji: '🎥',
      name: 'Video',
      title: 'Video Forensics',
      icon: VideoIcon,
      formats: ['MP4', 'MOV', 'WEBM'],
      status: 'Forensic Engine Active',
      accent: 'border-purple-500/30 text-purple-400',
      description:
        'Evaluates temporal frame consistency, inter-frame pixel differences, lighting flicker variance, and high-frequency edge stability.',
      plannedCapabilities: [
        'Multi-frame temporal sampling (< 12 frames)',
        'Luminance flicker & lighting variance check',
        'Edge texture sharpness consistency tracking',
      ],
    },
  ];

  return (
    <section id="supported-media" className="py-20 relative scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-semibold uppercase tracking-widest text-pink-400 bg-purple-950/80 px-3.5 py-1.5 rounded-full border border-pink-500/30">
            Multi-Modal Coverage
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Supported Media Formats
          </h2>
          <p className="mt-3 text-purple-200/80 text-base sm:text-lg">
            Synthetic media spans multiple formats. Forensiq AI is structured to inspect images, audio files, and full video sequences.
          </p>
        </div>

        {/* 3 Visual Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {mediaTypes.map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.id}
                interactive
                className="p-8 flex flex-col justify-between group relative overflow-hidden"
              >
                <div>
                  {/* Top Bar with Emoji & Status Indicator */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl" role="img" aria-label={item.name}>
                        {item.emoji}
                      </span>
                      <div className="p-2.5 rounded-xl bg-purple-950/80 text-pink-400 border border-purple-800/80">
                        <Icon className="w-5 h-5" />
                      </div>
                    </div>

                    {/* Active status indicator */}
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-950/90 border border-purple-800 text-[11px] font-medium text-pink-300">
                      <CheckCircle2 className="w-3 h-3 text-pink-400" />
                      <span>{item.status}</span>
                    </div>
                  </div>

                  {/* Card Title */}
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-pink-300 transition-colors">
                    {item.title}
                  </h3>

                  {/* Description */}
                  <p className="text-xs sm:text-sm text-purple-200/75 leading-relaxed mb-6">
                    {item.description}
                  </p>

                  {/* Formats Pills */}
                  <div className="mb-6">
                    <span className="text-[11px] uppercase tracking-wider text-purple-400/80 font-semibold block mb-2">
                      Target Formats
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {item.formats.map((fmt) => (
                        <span
                          key={fmt}
                          className="px-2 py-0.5 rounded-md bg-purple-950 text-purple-200 text-xs font-mono border border-purple-800/60"
                        >
                          {fmt}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Planned forensic capabilities */}
                <div className="pt-4 border-t border-purple-900/60 mt-4">
                  <span className="text-[11px] uppercase tracking-wider text-purple-300/80 font-semibold block mb-2">
                    Active Forensic Signals
                  </span>
                  <ul className="space-y-1.5">
                    {item.plannedCapabilities.map((cap) => (
                      <li key={cap} className="flex items-center gap-2 text-xs text-purple-200/70">
                        <Check className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                        <span>{cap}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
