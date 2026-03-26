import { useState, useEffect, useRef } from "react";
import "./index.css";

function TileGame() {
  const [level, setLevel] = useState(1);
  const [randomArr, setRandomArr] = useState<number[]>([]);
  const [userInputArr, setUserInputArr] = useState<number[]>([]);
  const [blockIsClickable, setBlockIsClickable] = useState(true);
  const [highscore, setHighscore] = useState(0);
  const gridRef = useRef(null);
  const [cols, setCols] = useState(3);
  const generate_rn = () => Math.floor(Math.random() * (cols * cols)) + 1;
  const [clickCount, setClickCount] = useState(0);
  const loseAudio = new Audio(`../public/sfx/roundlose.mp3`);
  const soundEffects = useRef<{ [key: number]: HTMLAudioElement }>({});
  const [isSideBarOpen, setIsSideBarOpen] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  
  //// Preload soundssssssssss
  useEffect(() => {
    for (let i = 1; i <= 12; i++) {
      soundEffects.current[i] = new Audio(`/sfx/${i}.mp3`);
      soundEffects.current[i].load(); 
    }
  }, []);

  const handleReset = () => {
    setBlockIsClickable(false);
    setRandomArr([]);
    setUserInputArr([]);
    setClickCount(0);
    setLevel(1);
    setTimeout(() => setIsSideBarOpen(true), 800);   
    setIsPlaying(false);
  };

  const handleClickOnBlock = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!blockIsClickable) {
      console.log("Not clickable while animating");
      return;
    }
    const target = e.target as HTMLDivElement;
    if (!target || !target.id) {
      console.error("Invalid target or missing id");
      return;
    }

    const tileId = Number(target.id);

    // Cycle through 12 sounds
    let soundIndex = ((tileId - 1) % 12) + 1;

    // Get preloaded audio
    const audio = soundEffects.current[soundIndex];

    if (audio) {
      audio.currentTime = 0; // Restart from the beginning
      audio.playbackRate = 1 + clickCount * 0.05; // Increase pitch gradually
      audio.play();
    } else {
      console.error(`Audio file /sfx/${soundIndex}.mp3 not found!`);
    }

    setClickCount((prev) => prev + 1);

    // Flash animation
    target.classList.add("flash");
    setTimeout(() => {
      if (document.body.contains(target)) {
        target.classList.remove("flash");
      }
    }, 500);

    setUserInputArr((prev) => [...prev, tileId]);
  };

  const handleClickOnStartBtn = async () => {
    setIsSideBarOpen(false);
    setIsPlaying(true);
    setRandomArr([]);
    setUserInputArr([]);
    setBlockIsClickable(false);
    await animateRandomTiles();
    setBlockIsClickable(true);
  }; 

  //  ya toh win hai ya toh lun hai
  useEffect(() => {
    if (userInputArr.length === randomArr.length && randomArr.length > 0) {
      if (userInputArr.join() === randomArr.join()) {
        roundOver(true);
        setTimeout(async () => {
          setBlockIsClickable(false);
          await animatePrevTiles();
          await animateRandomTiles();
          setBlockIsClickable(true);
        }, 2000);
      } else {
        loseAudio.play();
        
        roundOver(false);
        handleReset()
      }
    }
  }, [userInputArr]); 

  const animatePrevTiles = async (): Promise<void> => {
    setUserInputArr([]);
    for (const rn of randomArr) {
      const tile = document.getElementById(rn.toString());
      if (tile) {
        tile.classList.add("flash");
        await new Promise((resolve) =>
          setTimeout(() => {
            tile.classList.remove("flash");
            resolve("finish animating");
          }, 600)
        );
      }
    }
  }; 

  const animateRandomTiles = async () => {
    return new Promise<void>((resolve) => {
      let rn: number = generate_rn();

      if (rn === randomArr[randomArr.length - 1]) rn = generate_rn();
      setRandomArr((prevArr) => [...prevArr, rn]);

      setTimeout(() => {
        const tile = document.getElementById(rn.toString());
        if (tile) {
          tile.classList.add("flash");
          setTimeout(() => {
            tile.classList.remove("flash");
            resolve();
          }, 500);
        }
      }, 500);
    });
  }; 

  const roundOver = (isWin: boolean) => {

    if(!isWin){
     setIsPlaying(false);
 
    }

    const animationClass = isWin ? "win-animate" : "lose-animate";

    if (level > highscore) {
      setHighscore(level);
    }

    setLevel((prev) => prev + 1);
    setTimeout(() => {
      randomArr.forEach((e) => {
        const tile = document.getElementById(e.toString());
        if (tile) {
          tile.classList.add(animationClass);
          document.body.style.backgroundColor = isWin
            ? "#ffffff10"
            : "#ff000010";
          setTimeout(() => {
            tile.classList.remove(animationClass);
            document.body.style.backgroundColor = "#0a0a0a";
          }, 500);
        }
      });
    }, 100);
  }; 

  return (
    <div className=" min-h-screen min-w-screen p-6 md:p-12 lg:min-h-screen flex flex-col justify-center items-center gap-10 lg:gap-10">
      
      {isSideBarOpen &&
      
      <aside className=" absolute bg-[#00000099] backdrop-blur-sm min-h-screen  w-full  top-0 left-0 z-99 flex flex-col text-center gap-4">
       
       <div className="flex min-h-full justify-center items-center flex-col px-4 py-20 gap-4">
        <h1 className="text-xl md:text-4xl text-white text-center">
          Remember Tiles Sequence? <br />
        </h1>
        <p className="text-3xl">
          {" "}
          ( Level <span className="italic bg-indigo-800 p-2">{level}</span> )
        </p>
        <p>Your highscore is {highscore} </p>

        {!isPlaying &&
        <div
          className="flex flex-col  gap-4 items-center justify-center"
          id="options"
        >
          <div className="w-full flex justify-center">
            <button className="op-button" onClick={() => setCols(3)}>
              3x3
            </button>
            <button className="op-button" onClick={() => setCols(4)}>
              4x4
            </button>
            <button className="op-button" onClick={() => setCols(5)}>
              5x5
            </button>
          </div>
          <button
            id="start-btn"
            onClick={handleClickOnStartBtn}
            className="border-3 text-2xl font-black   cursor-pointer bg-gradient-to-br from-indigo-500 via-blue-700 to-blue-500 w-fit py-2 px-6 rounded-lg"
          >
            START
          </button>

      

        </div>}   
        
         {/* <button 
          onClick={handleReset}
          className="border-3 text-2xl font-black   cursor-pointer bg-gradient-to-br from-indigo-500 via-blue-700 to-blue-500 w-fit py-2 px-6 rounded-lg">Reset</button> */}
        
        </div>
      </aside>
      }

  <button onClick={() => setIsSideBarOpen((prev) => !prev)} className="underline underline-offset-4 p-3 z-[9999] absolute top-2 left-2">view settings</button>
      {/* grid-cols-3
    grid-cols-4
    grid-cols-5
  */}

    
        <div
          ref={gridRef}
          className={`   grid max-w-2xl  place-items-center grid-cols-${cols} gap-2 p-2 bg-indigo-400 rounded-lg`}
        >
          {[...Array(cols * cols)].map((_, i) => (
            <div
              key={i + 1}
              id={(i + 1).toString()}
              onClick={handleClickOnBlock}
              className="blocks w-18 h-18 md:w-20 md:h-20 "
            />
          ))}
        </div>
     
    </div>
  );
}

export default TileGame;
