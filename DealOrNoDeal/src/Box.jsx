import React from 'react';
import openedBox from './assets/openedBox.png';
import closedBox from './assets/closedBox.png';

export default function Box({ box, onClick, disabled }) {
    const isOpened = box.opened;

    return (
        <div
            className={`box ${box.opened ? 'opened' : ''} ${box.selected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
            onClick={() => {
                if (!disabled) {
                    onClick();
                }
            }}
        >
            {isOpened ? (
                <span>
                    <img src={openedBox} alt="opened box" />
                    <span>${box.amount.toLocaleString()}</span>
                </span>
            ) : (
                <img src={closedBox} alt="closed box" />
            )}
            <span>{box.selected ? `MY BOX ${box.id}` : box.id}</span>
        </div>
    );
}
