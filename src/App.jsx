import { useEffect, useRef, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const  [isLoading, data] = useFetch("http://localhost:3000/todo");
  const [todo, setTodo] = useState([]);
  const [currentTodo, setCurrentTodo] = useState(null);
  const [time, setTime] = useState(0);
  const [isTimer, setIsTimer] = useState(false); // 타이머(true) 쓸 건지 스탑워치(false) 쓸 건지

  useEffect(() => {
    if (currentTodo) {
      fetch(`http://localhost:3000/todo/${currentTodo}`, {
        method: "PATCH",
        body: JSON.stringify({time: todo.find((el) => el.id === currentTodo).time + 1})
      }).then(res => res.json())
        .then(res => setTodo(prev => prev.map(el => el.id === currentTodo ? res : el)))
    }
  }, [time])
  
  useEffect(() => { // 시간 초기화
    setTime(0); 
  }, [isTimer])

  useEffect(() => {
    if (data) {
      setTodo(data)
    }
  }, [isLoading])

  return (
    <>
      <h1>TODO LIST</h1>
      <Advice />
      <button onClick={() => setIsTimer(prev => !prev)}>{isTimer ? "스탑워치로 변경" : "타이머로 변경"}</button>
      <Clock />
      {isTimer ? <Timer time={time} setTime={setTime}/> : <StopWatch time={time} setTime={setTime}/>}
      <TodoInput setTodo={setTodo} todo={todo}/>
      <TodoList todo={todo} setTodo={setTodo} setCurrentTodo={setCurrentTodo} currentTodo={currentTodo}/>
    </>
  )
}

// 컴포넌트 분리 -> Todo를 표시하는 부분, Todo를 추가하는 부분, 리스트 각각의 항목으로 분리

const TodoInput = ({ setTodo, todo }) => {
  const inputRef = useRef(null)

  const addTodo = () => {
    const newTodo = { 
      content: inputRef.current.value,
      time: 0
    }

    fetch("http://localhost:3000/todo", { // 아이디는 알아서 만들어줌
      method: "POST", // url에 데이터 보내기
      body: JSON.stringify(newTodo)
    }).then(res => res.json())
      .then(res => setTodo((prev) => [...prev, res]))
  }

  return (
    <>
      <input ref={inputRef} />
      <button onClick={addTodo}>추가</button>
    </>
  )
}

const TodoList = ({ todo, setTodo, setCurrentTodo, currentTodo }) => {
  const deleteTodo = (id) => {
    fetch(`http://localhost:3000/todo/${id}`, { // 서버에서 id값으로 지우기 
      method: "DELETE"
    }).then(res => {
      if (res.ok) {
        setTodo((prev) => prev.filter((el) => el.id !== id));
      }
    })
  }

  return (
    <ul>
      {todo.map(el => <Todo 
      key={el.id} 
      el={el} 
      deleteTodo={deleteTodo}
      setCurrentTodo={setCurrentTodo}
      currentTodo={currentTodo}/>)}
    </ul>
  )
}

const Todo = ({ deleteTodo, el, setCurrentTodo, currentTodo}) => {
  return (
    <li className={currentTodo === el.id ? 'current' : ""}>
      <div>
        {el.content}
        <br />
        {formatTime(el.time)}
      </div>
      <div>
        <button onClick={() => {
          setCurrentTodo(el.id)
        }}>시작</button>
        <button onClick={() => deleteTodo(el.id)}>삭제</button> {/* 클릭한 항목의 id 전달 */}
      </div>
    </li>
  )
}

// 랜덤 명언 표시하기

const useFetch = (url) => {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch(url)
      .then(res => res.json())
      .then(res => {
        setData(res)
        setIsLoading(false)
      }) // 응답을 받아왔다면?
  }, [url]);

  return (
    [isLoading, data]
  )
}

const Advice = () => {
  const [isLoading, data] = useFetch("https://korean-advice-open-api.vercel.app/api/advice")
  
  return (
    <>
      {!isLoading && ( // 초기 data는 null 값이기 때문에 단축평가 필요함
        <>
          <h2 className='advice'>{data.message}</h2>
          <div className='advice'>- {data.author} -</div>
        </>
      )}
    </>
  )
}

// 현재 시간 표시

const Clock = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // 1초마다 시간을 업데이트

    // 한 번만 호출되기에 cleanup 함수가 필요하지 않음.
  }, []) // 처음 렌더링 될 때만 실행

  return (
    <h3 className='clock'>{currentTime.toLocaleTimeString()}</h3>
  )
}

// 스탑워치
const formatTime = (seconds) => {
  // seconds / 3600 -> 시간
  // (seconds % 3600) / 60 -> 분
  const timeString = `${String(Math.floor(seconds / 3600)).padStart(2, "0")} : 
  ${String(Math.floor((seconds % 3600) / 60)).padStart(2, "0")} : 
  ${String(seconds % 60).padStart(2, "0")}`

  return timeString;
}

const StopWatch = ({ time, setTime }) => {
  const [isOn, setIsOn] = useState(false); 
  const timerRef = useRef(null);

  useEffect(() => { 
    if (isOn) {
      const timerId = setInterval(() => { // id 값은 계속 변함 
        setTime((prev) => prev + 1);
      }, 1000)

      timerRef.current = timerId
    } else {
      clearInterval(timerRef.current);
    }
  }, [isOn])

  return (
    <div>
      {formatTime(time)}
      <button onClick={() => {
        setIsOn(prev => !prev)
      }}>{isOn ? "중지" : "시작"}</button>
      <button onClick={() => {
        setTime(0)
        setIsOn(false)
      }}>리셋</button>
    </div> 
  )
}

// 타이머

const Timer = ({ time, setTime }) => {
  const [startTimer, setStartTimer] = useState(30); // 시간 설정
  const [isOn, setIsOn] = useState(false);
  const timerRef = useRef(null);


  useEffect(() => {
    if (isOn && time > 0) {
      const timerId = setInterval(() => {
        setTime(prev => prev - 1)
      }, 1000)

      timerRef.current = timerId
    } else if (!isOn || time === 0) {
      clearInterval(timerRef.current)
    }

    return () => clearInterval(timerRef.current) // setInterval의 중복을 막자
  }, [isOn, time])

  return (
    <div>
      <div>
        {time ? formatTime(time) : formatTime(startTimer)}
        <button onClick={() => {
          setIsOn(true)
          setTime(time ? time : startTimer) 
          setStartTimer(0)
        }}>시작</button>
        <button onClick={() => setIsOn(false)}>정지</button>
        <button onClick={() => {
          setTime(0);
          setIsOn(false);
        }}>리셋</button>
      </div>
      <input 
        type='range' 
        value={startTimer} 
        max = '3600'
        min = '30'
        step= '30'
        onChange={(event) => setStartTimer(event.target.value)} />
    </div>
  )
}

export default App
