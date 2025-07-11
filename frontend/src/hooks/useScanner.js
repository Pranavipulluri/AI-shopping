import { useState, useCallback, useRef, useEffect } from 'react';
import Quagga from 'quagga';

export const useScanner = (onDetected) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const scannerRef = useRef(null);

  const startScanner = useCallback(() => {
    if (!scannerRef.current) return;

    Quagga.init({
      inputStream: {
        type: 'LiveStream',
        target: scannerRef.current,
        constraints: {
          width: 640,
          height: 480,
          facingMode: 'environment'
        }
      },
      locator: {
        patchSize: 'medium',
        halfSample: true
      },
      numOfWorkers: 2,
      decoder: {
        readers: ['ean_reader', 'ean_8_reader', 'code_128_reader', 'code_39_reader']
      },
      locate: true
    }, (err) => {
      if (err) {
        setError(err);
        console.error('Quagga init error:', err);
        return;
      }
      
      Quagga.start();
      setIsScanning(true);
    });

    Quagga.onDetected((result) => {
      if (result.codeResult.code) {
        onDetected(result.codeResult.code);
        stopScanner();
      }
    });
  }, [onDetected]);

  const stopScanner = useCallback(() => {
    if (isScanning) {
      Quagga.stop();
      setIsScanning(false);
    }
  }, [isScanning]);

  useEffect(() => {
    return () => {
      if (isScanning) {
        Quagga.stop();
      }
    };
  }, [isScanning]);

  return {
    scannerRef,
    isScanning,
    error,
    startScanner,
    stopScanner
  };
};