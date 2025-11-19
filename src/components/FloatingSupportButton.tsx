import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import SupportModal from './SupportModal';

export default function FloatingSupportButton() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-4 right-4 md:bottom-6 md:right-6 w-12 h-12 md:w-14 md:h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 z-40"
        title="Destek"
      >
        <MessageCircle className="w-5 h-5 md:w-6 md:h-6" />
      </button>

      {showModal && <SupportModal onClose={() => setShowModal(false)} />}
    </>
  );
}
