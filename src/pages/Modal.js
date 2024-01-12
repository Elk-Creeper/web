import React, { useState } from 'react';

const Modal = ({ image, onClose }) => {
    
    const [zoom, setZoom] = useState(1);
    const handleZoomIn = () => {
      setZoom(zoom + 0.1);
    };
    const handleZoomOut = () => {
      setZoom(Math.max(0.1, zoom - 0.1));
    };

    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content">
          <img src={image} alt="Enlarged Image" 
          style={{ transform: `scale(${zoom})`, width: '50%', height: 'auto' }}/>
        </div>
      </div>

      
    );
  };
  
  export default Modal;


