import { useState , useEffect } from 'react'
import './App.css'
import Box from './Box';


export default function App() {

  const [boxes, setBoxes] = useState(null);
  var selectedBox = null;
  const [remainingAmount, setRemainingAmount] = useState(3418416.01);
  const [offer, setOffer] = useState(0);

  //金额数组
  const amounts = [
    0.01,
    1,
    5,
    10,
    25,
    50,
    75,
    100,
    200,
    300,
    400,
    500,
    750,
    1000,
    5000,
    10000,
    25000,
    50000,
    75000,
    100000,
    200000,
    300000,
    400000,
    500000,
    750000,
    1000000
  ];

  //生成随机金额盒子
  function createBoxes() {
    const remainingAmounts = [...amounts];
    const boxes = [];
    for (let boxId = 1; boxId <= amounts.length; boxId++) {
      const randomIndex = Math.floor(Math.random() * remainingAmounts.length);
      const [amount] = remainingAmounts.splice(randomIndex, 1);
      boxes.push({
        id: boxId,
        amount,
        opened: false,
        selected: false
      });
    }
    return boxes;
  }

  //选择留下的盒子
  function handleBoxSelect(boxId) {
    setBoxes(prevBoxes => {
      return prevBoxes.map(box => {
        if (box.id === boxId) {
          return { ...box, selected: true };
        }
        return box;
      });
    });
    selectedBox = boxId;
  }

  //打开盒子
  function handleBoxOpen(boxId) {
    setBoxes(prevBoxes => {
      return prevBoxes.map(box => {
        if (box.id === boxId) {
          return { ...box, opened: true };
        }
        return box;
      });
    });
    setRemainingAmount(prevAmount => {
      const openedBox = boxes.find(box => box.id === boxId);
      return prevAmount - openedBox.amount;
    });
  }

















  //返回视图
  return (
    <div className="App">
      <h1>Deal or No Deal</h1>
      <div className='awards' style={{ display: 'flex', justifyContent: 'center' }}>
        <div>
          {amounts.slice(0, 13).map((amount, index) => (
            <div key={index} className="award">
              ${amount.toLocaleString()}
            </div>
          ))}
        </div>
        <div>
          {amounts.slice(13, 26).map((amount, index) => (
            <div key={index} className="award">
              ${amount.toLocaleString()}
            </div>
          ))}
        </div>
      </div>
      <div className="boxes">
        {boxes.map(box => (
          <Box
            key={box.id}
            box={box}
            onClick={() => {
              const hasSelectedBox = boxes.some(box => box.selected);

              if (!hasSelectedBox) {
                handleBoxSelect(box.id);
              } else {
                handleBoxOpen(box.id);
              }
            }}
            disabled={box.opened || box.selected}
          >
          </Box>
        ))}
      </div>
    </div>
  );






}