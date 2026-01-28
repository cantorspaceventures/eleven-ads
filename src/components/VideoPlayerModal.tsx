import { X, Play, FileText } from 'lucide-react';

interface VideoPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  video: {
    title: string;
    description: string;
    videoUrl: string;
    script: string;
  } | null;
}

export default function VideoPlayerModal({ isOpen, onClose, video }: VideoPlayerModalProps) {
  if (!isOpen || !video) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 flex items-center">
            <Play className="w-5 h-5 mr-2 text-blue-600" /> {video.title}
          </h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Video Container */}
        <div className="aspect-video bg-black relative group">
          <video 
            src={video.videoUrl} 
            className="w-full h-full object-contain"
            controls
            autoPlay
          >
            Your browser does not support the video tag.
          </video>
        </div>

        {/* Content/Script Section */}
        <div className="p-6 overflow-y-auto bg-gray-50 flex-1">
          <div className="flex items-start space-x-4">
            <div className="flex-1">
              <h4 className="font-bold text-gray-900 mb-2">Description</h4>
              <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                {video.description}
              </p>

              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h4 className="font-bold text-gray-900 mb-3 flex items-center text-sm uppercase tracking-wider">
                  <FileText className="w-4 h-4 mr-2 text-gray-400" /> Video Script / Transcript
                </h4>
                <div className="prose prose-sm max-w-none text-gray-600 space-y-2 font-mono text-xs">
                  {video.script.split('\n').map((line, i) => (
                    <p key={i} className="border-b border-gray-50 pb-1 last:border-0">{line}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
