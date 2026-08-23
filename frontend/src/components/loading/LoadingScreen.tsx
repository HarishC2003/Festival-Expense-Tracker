import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useLoading } from './LoadingContext';
import loadingVideo from '../../assets/loading.mp4';

export const LoadingScreen: React.FC = () => {
  const { isLoading } = useLoading();
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isLoading && videoRef.current) {
      videoRef.current.defaultMuted = true;
      videoRef.current.muted = true;
      videoRef.current.play().catch(e => console.log('Video play failed', e));
    }
  }, [isLoading]);

  return createPortal(
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#050505] overflow-hidden"
        >
          {/* Video Container */}
          <div className="relative w-[160px] md:w-[280px] lg:w-[360px] aspect-square flex items-center justify-center mb-8 z-10 bg-transparent">
            <video
              ref={videoRef}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              className="w-full h-full object-contain bg-transparent"
              src={loadingVideo}
            />
          </div>

          {/* Text and Progress */}
          <div className="relative z-10 flex flex-col items-center text-center mt-4">
            <h2 className="text-white font-bold text-xl md:text-2xl tracking-wide mb-3 drop-shadow-md">
              {t('common.loading')}
            </h2>
            <p className="text-[rgba(255,255,255,0.6)] text-xs md:text-sm tracking-[4px] font-light mb-8 uppercase">
              {t('common.preparing')}
            </p>

            {/* Glowing Golden Dots (Progress) */}
            <div className="flex items-center space-x-3">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-[#D4AF37] shadow-[0_0_8px_#D4AF37]"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.2
                  }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};
