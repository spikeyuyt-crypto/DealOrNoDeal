import { useState, useEffect } from 'react'
import './App.css'
import Box from './Box';
import banker from './assets/banker.png';

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
const totalPrizeAmount = amounts.reduce((sum, amount) => sum + amount, 0);
const roundOpenBoxCount = [6, 5, 4, 3, 2, 1, 1, 1, 1];
const GameStatus = {
  Waiting: 'waiting',
  Offer: 'offer',
  FinalOffer: 'finalOffer',
  Finished: 'finished',
};

function roundOfferAmount(amount) {
  if (amount >= 100000) {
    return Math.round(amount / 10000) * 10000;
  }

  if (amount >= 10000) {
    return Math.round(amount / 1000) * 1000;
  }

  if (amount >= 1000) {
    return Math.round(amount / 100) * 100;
  }

  if (amount >= 100) {
    return Math.round(amount / 10) * 10;
  }

  return Math.round(amount);
}

function getCashPressureFactor(playerCash, initialCash) {
  if (initialCash <= 0) {
    return 1;
  }

  const cashRatio = playerCash / initialCash;

  if (cashRatio <= 0.25) {
    return 1.15;
  }

  if (cashRatio <= 0.5) {
    return 1.08;
  }

  if (cashRatio <= 1) {
    return 1;
  }

  if (cashRatio <= 1.5) {
    return 0.96;
  }

  return 0.92;
}

function calculateBankerDeal({
  boxes,
  gameRound,
  difficulty,
  playerCash,
  initialCash,
  isFinalOffer,
}) {
  const unopenedAmounts = boxes
    .filter(box => !box.opened)
    .map(box => box.amount);

  if (unopenedAmounts.length === 0) {
    return {
      offer: 0,
      maxAccept: 0,
    };
  }

  const totalRemainingAmount = unopenedAmounts.reduce((sum, amount) => {
    return sum + amount;
  }, 0);
  const expectedValue = totalRemainingAmount / unopenedAmounts.length;
  const highestRemainingAmount = Math.max(...unopenedAmounts);

  const roundFactors = [0.35, 0.50, 0.68, 0.88, 1.08, 1.25, 1.42, 1.58, 1.75];
  const roundFactor = roundFactors[gameRound - 1] ?? 1.75;
  const finalFactor = 1.65;
  const baseMultiplier = isFinalOffer ? finalFactor : roundFactor;

  const difficultyFactor = {
    easy: 1.08,
    medium: 1,
    hard: 0.92,
  }[difficulty] ?? 1;

  const bigAmounts = amounts.filter(amount => amount >= 100000);
  const remainingBigAmounts = unopenedAmounts.filter(amount => amount >= 100000);
  const bigAmountSurvivalRate =
    bigAmounts.length === 0 ? 0 : remainingBigAmounts.length / bigAmounts.length;
  const riskFactor = 0.95 + bigAmountSurvivalRate * 0.15;

  const pressureFactor = getCashPressureFactor(playerCash, initialCash);
  const noiseFactor = 0.96 + Math.random() * 0.1;

  const rawOffer =
    expectedValue *
    baseMultiplier *
    riskFactor *
    difficultyFactor *
    pressureFactor *
    noiseFactor;

  const offerCapFactor = isFinalOffer ? 0.95 : 0.9;
  const cappedOffer = Math.min(rawOffer, highestRemainingAmount * offerCapFactor);
  const minimumOffer = expectedValue * 0.25;
  const offer = roundOfferAmount(Math.max(cappedOffer, minimumOffer));

  const negotiationFactors = [2.00, 1.85, 1.70, 1.55, 1.42, 1.33, 1.27, 1.24, 1.21];
  const negotiationFactor = isFinalOffer
    ? 1.21
    : negotiationFactors[gameRound - 1] ?? 1.21;
  const maxAcceptCapFactor = isFinalOffer ? 0.98 : 0.94;
  const rawMaxAccept = offer * negotiationFactor;
  const cappedMaxAccept = Math.min(rawMaxAccept, highestRemainingAmount * maxAcceptCapFactor);
  const maxAccept = roundOfferAmount(Math.max(cappedMaxAccept, offer));

  return {
    offer,
    maxAccept,
  };
}

function evaluateCounterOffer(counterOffer, bankerDeal) {
  if (counterOffer <= bankerDeal.maxAccept) {
    return {
      result: 'accepted',
      amount: counterOffer,
    };
  }

  if (counterOffer <= bankerDeal.maxAccept * 1.08) {
    return {
      result: 'countered',
      amount: bankerDeal.maxAccept,
    };
  }

  return {
    result: 'rejected',
    amount: bankerDeal.offer,
  };
}

export default function App() {
  const [boxes, setBoxes] = useState(createBoxes);
  const [, setRemainingAmount] = useState(totalPrizeAmount);
  const [bankerDeal, setBankerDeal] = useState({ offer: 0, maxAccept: 0 });
  const [counterOffer, setCounterOffer] = useState('');
  const [negotiationMessage, setNegotiationMessage] = useState('');
  const [hasNegotiated, setHasNegotiated] = useState(false);
  const [difficulty, setDifficulty] = useState('easy');
  const [gameStatus, setGameStatus] = useState(GameStatus.Waiting);
  const [gameRound, setGameRound] = useState(1);
  const [openedThisRound, setOpenedThisRound] = useState(0);
  const [displayRules, setDisplayRules] = useState(false);


  const ticketPrice = () => {
    switch (difficulty) {
      case 'easy':
        return 130000;
      case 'medium':
        return 150000;
      case 'hard':
        return 170000;
      default:
        return 100000;
    }
  }

  const initialPlayerCash = () => {
    switch (difficulty) {
      case 'easy':
        return 1000000;
      case 'medium':
        return 750000;
      case 'hard':
        return 500000;
      default:
        return 100000;
    }
  }
  const [playerCash, setPlayerCash] = useState(() => initialPlayerCash() - ticketPrice());

  const unopenedPlayableBoxes = boxes.filter(box => !box.opened && !box.selected).length;
  const requiredOpenCount = roundOpenBoxCount[gameRound - 1] ?? 1;
  const maxCanOpenBeforeFinalOffer = Math.max(unopenedPlayableBoxes - 1, 0);
  const actualRequiredOpenCount = Math.min(requiredOpenCount, maxCanOpenBeforeFinalOffer);
  const boxesToOpen = Math.max(actualRequiredOpenCount - openedThisRound, 0);







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
  }

  //打开盒子
  function handleBoxOpen(boxId) {
    if (gameStatus !== GameStatus.Waiting) {
      return;
    }

    const openedBox = boxes.find(box => box.id === boxId);
    if (!openedBox) {
      return;
    }

    const nextBoxes = boxes.map(box => {
      if (box.id === boxId) {
        return { ...box, opened: true };
      }

      return box;
    });

    setBoxes(nextBoxes);
    setRemainingAmount(prevAmount => {
      return prevAmount - openedBox.amount;
    });

    const nextOpenedThisRound = openedThisRound + 1;
    const nextUnopenedPlayableBoxes = unopenedPlayableBoxes - 1;
    if (nextUnopenedPlayableBoxes === 1) {
      const nextBankerDeal = calculateBankerDeal({
        boxes: nextBoxes,
        gameRound,
        difficulty,
        playerCash,
        initialCash: initialPlayerCash(),
        isFinalOffer: true,
      });

      setBankerDeal(nextBankerDeal);
      setCounterOffer('');
      setNegotiationMessage('');
      setOpenedThisRound(0);
      setGameStatus(GameStatus.FinalOffer);
      return;
    }

    if (nextOpenedThisRound >= actualRequiredOpenCount) {
      const nextBankerDeal = calculateBankerDeal({
        boxes: nextBoxes,
        gameRound,
        difficulty,
        playerCash,
        initialCash: initialPlayerCash(),
        isFinalOffer: false,
      });

      setBankerDeal(nextBankerDeal);
      setCounterOffer('');
      setNegotiationMessage('');
      setOpenedThisRound(0);
      setGameStatus(GameStatus.Offer);
      setGameRound(prevRound => prevRound + 1);
    } else {
      setOpenedThisRound(nextOpenedThisRound);
    }
  }

  function settleDeal(amount, message = `Deal accepted: $${amount.toLocaleString()}`) {
    setPlayerCash(prevCash => prevCash + amount);
    setBankerDeal({ offer: amount, maxAccept: amount });
    setCounterOffer('');
    setNegotiationMessage(message);
    setGameStatus(GameStatus.Finished);
  }

  function handleDeal() {
    settleDeal(bankerDeal.offer);
  }

  function handleNoDeal() {
    setCounterOffer('');
    setNegotiationMessage('');
    setBankerDeal({ offer: 0, maxAccept: 0 });

    if (gameStatus === GameStatus.FinalOffer) {
      const selectedBox = boxes.find(box => box.selected);
      const finalAmount = selectedBox ? selectedBox.amount : 0;
      settleDeal(finalAmount, `No Deal. Your box contained $${finalAmount.toLocaleString()}.`);
      return;
    }

    setGameStatus(GameStatus.Waiting);
  }

  function handleNegotiate() {
    if (hasNegotiated) {
      setNegotiationMessage('You already used your negotiation.');
      return;
    }

    const requestedAmount = Math.round(Number(counterOffer));
    if (!Number.isFinite(requestedAmount) || requestedAmount <= bankerDeal.offer) {
      setNegotiationMessage('Enter an amount higher than the banker offer.');
      return;
    }

    const negotiationResult = evaluateCounterOffer(requestedAmount, bankerDeal);
    setHasNegotiated(true);

    if (negotiationResult.result === 'accepted') {
      settleDeal(negotiationResult.amount);
      return;
    }

    if (negotiationResult.result === 'countered') {
      const counterAmount = negotiationResult.amount;
      setBankerDeal({
        offer: counterAmount,
        maxAccept: counterAmount,
      });
      setNegotiationMessage(`Banker counters at $${counterAmount.toLocaleString()}.`);
      return;
    }

    setNegotiationMessage('Banker rejected your counteroffer.');
  }

  function handleRestartGame() {
    const entryFee = ticketPrice();

    if (playerCash < entryFee) {
      setNegotiationMessage(`Not enough cash for the $${entryFee.toLocaleString()} entry fee.`);
      return;
    }

    setPlayerCash(prevCash => prevCash - entryFee);
    setBoxes(createBoxes());
    setRemainingAmount(totalPrizeAmount);
    setBankerDeal({ offer: 0, maxAccept: 0 });
    setCounterOffer('');
    setNegotiationMessage('');
    setHasNegotiated(false);
    setGameRound(1);
    setOpenedThisRound(0);
    setGameStatus(GameStatus.Waiting);
  }

  const openedAmounts = new Set(
    boxes.filter(box => box.opened).map(box => box.amount)
  );
  const isBankerPhase =
    gameStatus === GameStatus.Offer || gameStatus === GameStatus.FinalOffer;
  const isGameFinished = gameStatus === GameStatus.Finished;


  useEffect(() => {setDisplayRules(true)}, []);
  


  //返回视图
  return (
    <div className="App">
      <h1>Deal or No Deal</h1>

      {/* 左侧剩余金额 */}

      <div className='awards'>
        <div className="awards-header">
          <h2>难度选择</h2>
          <select
            value={difficulty}
            onChange={e => setDifficulty(e.target.value)}
          >
            <option value="easy">赌博默示录</option>
            <option value="medium">赌博破戒录</option>
            <option value="hard">赌博堕天录</option>
          </select>
          <h3>Entry fee: ${ticketPrice().toLocaleString()}</h3>
        </div>
        <div>
          {amounts.slice(0, 13).map((amount, index) => (
            <div
              key={index}
              className={`award ${openedAmounts.has(amount) ? 'dimmed' : ''}`}
              id={`award-${index}`}
            >
              ${amount.toLocaleString()}
            </div>
          ))}
        </div>
        <div>
          {amounts.slice(13, 26).map((amount, index) => (
            <div
              key={index}
              className={`award ${openedAmounts.has(amount) ? 'dimmed' : ''}`}
              id={`award-${index + 13}`}
            >
              ${amount.toLocaleString()}
            </div>
          ))}
        </div>
      </div>

      {/* 箱子区域 */}
      {(isBankerPhase || isGameFinished) && (
        <div className="banker-panel">
          <h2>
            {isGameFinished
              ? 'Game Over'
              : gameStatus === GameStatus.FinalOffer
                ? 'Final Offer'
                : 'Banker Offer'}
          </h2>
          <div className="banker-offer">${bankerDeal.offer.toLocaleString()}</div>
          {negotiationMessage && (
            <p>{negotiationMessage}</p>
          )}
          {isBankerPhase && (
            <>
              <div className="banker-actions">
                <button type="button" onClick={handleDeal}>Deal</button>
                <button type="button" onClick={handleNoDeal}>No Deal</button>
              </div>
              {!hasNegotiated && (
                <div className="negotiation">
                  <input
                    type="number"
                    min={bankerDeal.offer + 1}
                    value={counterOffer}
                    onChange={e => setCounterOffer(e.target.value)}
                    placeholder="Counter offer"
                  />
                  <button type="button" onClick={handleNegotiate}>Negotiate</button>
                </div>
              )}
            </>
          )}
          {isGameFinished && (
            <div className="banker-actions">
              <button type="button" onClick={handleRestartGame}>New Game</button>
            </div>
          )}
        </div>
      )}

      <div className="boxes-stage">
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
              disabled={box.opened || box.selected || isBankerPhase || isGameFinished}
            >
            </Box>
          ))}
        </div>

        {displayRules && (
          <div className="rules">
            <h3>Game Rules</h3>
            <p>1. Choose one case as your own. You cannot open it until the end.</p>
            <p>2. Open the remaining cases to reveal their hidden amounts.</p>
            <p>3. After each round, the banker will make an offer.</p>
            <p>4. Accept the offer to lock in the deal, or reject it and keep playing.</p>
            <p>5. You can negotiate with the banker once during the game.</p>
            <p>6. The game ends when you accept a deal or keep your own final case.</p>
            <button type="button" onClick={() => setDisplayRules(false)}>Start Game</button>
          </div>
        )}
      </div>

      {/* 右侧banker报价 */}
      <div className="banker-status">
        <h3>距离下次报价还需开{boxesToOpen}个箱子</h3>
      </div>
      <img className="banker-image" src={banker} alt="Banker" />
      <div className="player-cash">
        <h2>Player Cash: ${playerCash.toLocaleString()}</h2>
      </div>

    </div>
  );






}
