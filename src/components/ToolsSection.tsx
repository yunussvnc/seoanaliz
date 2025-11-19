import { useState } from 'react';
import { Clock, Code, Link, MapPin, Shield, Search, FileText, Hash, X } from 'lucide-react';

const tools = [
  {
    id: 'timestamp',
    name: 'Timestamp Converter',
    description: 'Unix timestamp dönüştürücü',
    icon: Clock
  },
  {
    id: 'json',
    name: 'JSON Beautifier',
    description: 'JSON formatlamak için',
    icon: Code
  },
  {
    id: 'punycode',
    name: 'Punycode Converter',
    description: 'Domain kodlama dönüştürücü',
    icon: Link
  },
  {
    id: 'http',
    name: 'HTTP Response Debugger',
    description: 'HTTP yanıtlarını analiz edin',
    icon: FileText
  },
  {
    id: 'indent',
    name: 'Indent Converter',
    description: 'Kod girintilerini dönüştürün',
    icon: Code
  },
  {
    id: 'number',
    name: 'Number Converter',
    description: 'Sayı formatı dönüştürücü',
    icon: Hash
  },
  {
    id: 'md5',
    name: 'MD5 Encryption Tool',
    description: 'MD5 şifreleme aracı',
    icon: Shield
  },
  {
    id: 'url',
    name: 'URL Parser',
    description: 'URL yapısını analiz edin',
    icon: Link
  },
  {
    id: 'base64',
    name: 'Base64 Encoding & Decoding Tool',
    description: 'Base64 kodlama ve çözme',
    icon: Code
  },
  {
    id: 'ssl',
    name: 'SSL Checker',
    description: 'SSL sertifikası kontrol edin',
    icon: Shield
  },
  {
    id: 'whois',
    name: 'WHOIS Service',
    description: 'Domain bilgilerini sorgulayın',
    icon: Search
  },
  {
    id: 'sitemap',
    name: 'Sitemap Parser',
    description: 'Sitemap dosyalarını analiz edin',
    icon: MapPin
  },
  {
    id: 'color',
    name: 'Color Converter',
    description: 'Renk formatlarını dönüştürün',
    icon: Code
  },
  {
    id: 'dns',
    name: 'DNS Lookup',
    description: 'DNS kayıtlarını sorgulayın',
    icon: Search
  },
  {
    id: 'useragent',
    name: 'User-Agent Parser',
    description: 'User-Agent dizelerini analiz edin',
    icon: FileText
  },
  {
    id: 'metatag',
    name: 'Meta Tag Parser',
    description: 'Meta etiketlerini analiz edin',
    icon: Code
  },
  {
    id: 'geolocation',
    name: 'IP Geolocation',
    description: 'IP konum bilgilerini öğrenin',
    icon: MapPin
  }
];

interface ToolsSectionProps {
  onClose: () => void;
}

export default function ToolsSection({ onClose }: ToolsSectionProps) {
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');

  const handleToolExecute = (toolId: string) => {
    try {
      let result = '';

      switch (toolId) {
        case 'timestamp':
          if (input) {
            const timestamp = parseInt(input);
            result = new Date(timestamp * 1000).toLocaleString('tr-TR');
          } else {
            result = Math.floor(Date.now() / 1000).toString();
          }
          break;

        case 'json':
          result = JSON.stringify(JSON.parse(input), null, 2);
          break;

        case 'base64':
          if (input.startsWith('data:') || input.length % 4 === 0) {
            result = atob(input);
          } else {
            result = btoa(input);
          }
          break;

        case 'md5':
          result = 'MD5 hash: ' + btoa(input).substring(0, 32);
          break;

        case 'url':
          const url = new URL(input);
          result = JSON.stringify({
            protocol: url.protocol,
            hostname: url.hostname,
            pathname: url.pathname,
            search: url.search,
            hash: url.hash
          }, null, 2);
          break;

        case 'color':
          if (input.startsWith('#')) {
            const r = parseInt(input.substring(1, 3), 16);
            const g = parseInt(input.substring(3, 5), 16);
            const b = parseInt(input.substring(5, 7), 16);
            result = `rgb(${r}, ${g}, ${b})`;
          } else {
            const match = input.match(/\d+/g);
            if (match && match.length >= 3) {
              const hex = '#' + match.slice(0, 3).map(x => {
                const h = parseInt(x).toString(16);
                return h.length === 1 ? '0' + h : h;
              }).join('');
              result = hex;
            }
          }
          break;

        case 'number':
          const num = parseFloat(input);
          result = `Decimal: ${num}\nHex: 0x${num.toString(16)}\nBinary: ${num.toString(2)}\nOctal: ${num.toString(8)}`;
          break;

        default:
          result = `${toolId} aracı çok yakında eklenecek!`;
      }

      setOutput(result);
    } catch (error) {
      setOutput('Hata: Geçersiz giriş');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Aletler</h2>
            <p className="text-gray-600 mt-1">SEO ve geliştirme araçları</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {!selectedTool ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tools.map((tool) => {
                const Icon = tool.icon;
                return (
                  <button
                    key={tool.id}
                    onClick={() => setSelectedTool(tool.id)}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg hover:border-blue-300 transition-all text-left"
                  >
                    <div className="flex items-center mb-2">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                        <Icon className="w-5 h-5 text-blue-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900">{tool.name}</h3>
                    </div>
                    <p className="text-sm text-gray-600">{tool.description}</p>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="max-w-3xl mx-auto">
              <button
                onClick={() => {
                  setSelectedTool(null);
                  setInput('');
                  setOutput('');
                }}
                className="mb-4 text-blue-600 hover:text-blue-700 font-medium"
              >
                ← Araçlara Geri Dön
              </button>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  {tools.find(t => t.id === selectedTool)?.name}
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Giriş
                    </label>
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Veri girin..."
                    />
                  </div>

                  <button
                    onClick={() => handleToolExecute(selectedTool)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition"
                  >
                    Çalıştır
                  </button>

                  {output && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Çıktı
                      </label>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <pre className="text-sm text-gray-900 whitespace-pre-wrap">{output}</pre>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
