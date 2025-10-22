(() => {
  // Question set
  const QUESTIONS = [
    {id:1,type:"single",question:"What is the capital of France?",options:["Berlin","Paris","Rome","Madrid"],answer:"Paris"},
    {id:2,type:"multi",question:"Select the prime numbers:",options:["2","3","4","9","11"],answer:["2","3","11"]},
    {id:3,type:"text",question:"Fill in the blank: The chemical symbol for water is ____.",answer:["h2o"]},
    {id:4,type:"single",question:"Which planet is known as the Red Planet?",options:["Venus","Mars","Jupiter","Neptune"],answer:"Mars"},
    {id:5,type:"multi",question:"Which of these are programming languages?",options:["Python","HTML","CSS","JavaScript"],answer:["Python","JavaScript"]},
    {id:6,type:"text",question:"Fill: HTTP stands for ____ Transfer Protocol.",answer:["hypertext","hyper text"]}
  ];

  // DOM
  const qText=document.getElementById("question-text"),
        answersForm=document.getElementById("answers-form"),
        qIndexEl=document.getElementById("q-index"),
        qTotalEl=document.getElementById("q-total"),
        prevBtn=document.getElementById("prev-btn"),
        nextBtn=document.getElementById("next-btn"),
        skipBtn=document.getElementById("skip-btn"),
        restartBtn=document.getElementById("restart-btn"),
        retryBtn=document.getElementById("retry-btn"),
        homeBtn=document.getElementById("home-btn"),
        timerEl=document.getElementById("timer"),
        timerToggle=document.getElementById("timer-toggle"),
        resultArea=document.getElementById("result-area"),
        quizArea=document.getElementById("quiz-area"),
        scoreText=document.getElementById("score-text"),
        details=document.getElementById("detailed-results"),
        progressFill=document.getElementById("progress-fill"),
        printBtn=document.getElementById("print-btn");

  let pool=[],index=0,answers={},timer=null,remaining=20;

  // Helpers
  const shuffle=a=>a.sort(()=>Math.random()-.5);
  const normalize=t=>(t||"").toString().trim().toLowerCase();

  function prepare(){return shuffle(QUESTIONS.map(q=>{
    const c=JSON.parse(JSON.stringify(q));
    if(c.options)shuffle(c.options);
    return c;
  }));}

  // LocalStorage
  const saveState=()=>localStorage.setItem("quiz_state",JSON.stringify({pool,index,answers}));
  const loadState=()=>{
    const s=localStorage.getItem("quiz_state");
    if(!s)return false;
    try{
      const d=JSON.parse(s);
      if(!d.pool)return false;
      pool=d.pool;index=d.index;answers=d.answers;
      return true;
    }catch{return false;}
  };
  const clearState=()=>localStorage.removeItem("quiz_state");

  function startQuiz(){
    if(!loadState()){
      pool=prepare();index=0;answers={};
    }
    qTotalEl.textContent=pool.length;
    showQuestion();
    showQuiz();
  }

  function showQuiz(){
    quizArea.classList.remove("hidden");
    resultArea.classList.add("hidden");
  }
  function showResult(){
    quizArea.classList.add("hidden");
    resultArea.classList.remove("hidden");
    clearState();
    renderResults();
  }

  function renderQuestion(q){
    qText.textContent=q.question;
    answersForm.innerHTML="";
    if(q.type==="single"||q.type==="multi"){
      q.options.forEach(opt=>{
        const lbl=document.createElement("label");
        lbl.className="option";
        const input=document.createElement("input");
        input.type=q.type==="single"?"radio":"checkbox";
        input.name="opt";input.value=opt;
        const saved=answers[q.id];
        if(saved){
          if(q.type==="single"&&saved.value===opt)input.checked=true;
          if(q.type==="multi"&&(saved.value||[]).includes(opt))input.checked=true;
        }
        input.addEventListener("change",()=>saveCurrent());
        lbl.appendChild(input);
        lbl.appendChild(document.createTextNode(opt));
        answersForm.appendChild(lbl);
      });
    }else{
      const input=document.createElement("input");
      input.type="text";input.className="text-answer";
      input.placeholder="Type your answer...";
      input.value=(answers[q.id]&&answers[q.id].value)||"";
      input.addEventListener("input",()=>saveCurrent());
      answersForm.appendChild(input);
    }
    updateProgress();
    saveState();
  }

  function saveCurrent(){
    const q=pool[index];
    let val;
    if(q.type==="single"){
      const c=answersForm.querySelector("input[type=radio]:checked");
      val=c?c.value:null;
    }else if(q.type==="multi"){
      val=[...answersForm.querySelectorAll("input[type=checkbox]:checked")].map(x=>x.value);
    }else{
      val=answersForm.querySelector("input.text-answer").value.trim();
    }
    const correct=evaluate(q,val);
    answers[q.id]={value:val,correct};
    saveState();
  }

  function evaluate(q,val){
    if(q.type==="single")return normalize(val)===normalize(q.answer);
    if(q.type==="multi"){
      const e=(q.answer||[]).map(normalize).sort(),g=(val||[]).map(normalize).sort();
      return JSON.stringify(e)===JSON.stringify(g);
    }
    if(q.type==="text")return(q.answer||[]).map(normalize).includes(normalize(val));
  }

  function showQuestion(){
    stopTimer();
    const q=pool[index];
    qIndexEl.textContent=index+1;
    renderQuestion(q);
    prevBtn.disabled=index===0;
    if(timerToggle.checked){
      remaining=20;
      timerEl.textContent=remaining;
      timerEl.style.visibility="visible";
      startTimer();
    }else timerEl.style.visibility="hidden";
  }

  function next(){
    saveCurrent();
    if(index<pool.length-1){index++;showQuestion();}
    else finish();
  }
  function prev(){if(index>0){index--;showQuestion();}}

  function startTimer(){
    stopTimer();
    timer=setInterval(()=>{
      remaining--;timerEl.textContent=remaining;
      if(remaining<=0){next();}
    },1000);
  }
  function stopTimer(){if(timer){clearInterval(timer);timer=null;}}

  function finish(){
    stopTimer();
    let score=0;
    pool.forEach(q=>{if(answers[q.id]&&answers[q.id].correct)score++;});
    scoreText.textContent=`You scored ${score}/${pool.length} (${Math.round((score/pool.length)*100)}%)`;
    showResult();
  }

  function renderResults(){
    details.innerHTML="";
    pool.forEach((q,i)=>{
      const div=document.createElement("div");
      div.style.marginBottom="8px";
      const ans=answers[q.id]?answers[q.id].value:null;
      const corr=q.answer;
      const ok=answers[q.id]&&answers[q.id].correct;
      div.innerHTML=`<strong>Q${i+1}:</strong> ${q.question}<br>
      <strong>Your:</strong> ${Array.isArray(ans)?ans.join(", "):ans||"<em>No answer</em>"}<br>
      <strong>Correct:</strong> ${Array.isArray(corr)?corr.join(", "):corr} — 
      <span style="color:${ok?'#22d3a6':'#ff6b6b'}">${ok?'Correct':'Incorrect'}</span>`;
      details.appendChild(div);
    });
  }

  function updateProgress(){
    progressFill.style.width=`${((index+1)/pool.length)*100}%`;
  }

  // Events
  nextBtn.onclick=e=>{e.preventDefault();next();};
  prevBtn.onclick=e=>{e.preventDefault();prev();};
  skipBtn.onclick=e=>{e.preventDefault();next();};
  restartBtn.onclick=e=>{e.preventDefault();clearState();startQuiz();};
  retryBtn.onclick=e=>{e.preventDefault();clearState();startQuiz();};
  homeBtn.onclick=e=>{e.preventDefault();clearState();startQuiz();};
  printBtn.onclick=e=>{window.print();};

  document.addEventListener("keydown",e=>{
    if(e.key==="ArrowRight")next();
    if(e.key==="ArrowLeft")prev();
  });

  // Init
  startQuiz();
})();
