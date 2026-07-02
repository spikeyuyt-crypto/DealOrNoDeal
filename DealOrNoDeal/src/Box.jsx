import React from 'react'

export default function Box({ box, onClick, disabled }) {
    const isOpened = !box.isClosed();

    return (
        <div className="box" onClick={() => !disabled && onClick(box.id)}>
            {isOpened ? <span><img src='../assets/openedBox.png'/><span>{box.amount}</span></span>
            :<img src='../assets/closedBox.png'/>}
            <span>{box.id}</span>
        </div>
    )
}