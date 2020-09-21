var GAME_LEVELS = [['xxxgxxx',
'xk   @x',
'xYYi ix',
'x  ikix',
'x    ix',
'xxxxxxx']
,
['xxxxxxxx',
'g@  Y-kx',
'x1    Yx',
'xk1 Y-kx',
'xxxxxxxx']
,
['xxvxvxxx',
 'x l  44x',
 'c    4kx',
 'x  @ 44x',
 'gYYY   r',
 'xYkY   x',
 'xxxxxxxx']
,
['xxxxxxxxxxxxx',
 'g@123456xxxxx',
 'xxxxxxxMxvVxx',
 'x          +x',
 'x xvxVxxVxvxx',
 'x M    m   kx',
 'xxxxxxxxxxxxx',]
,
['xxxxxxxxxxxxxx',
 'xk67 k12    or',
 'x5g1 7x3     x',
 'x432 654  YYYx',
 'x       @ YYYx',
 'C   o     YYkx',
 'xNxxxxxxxxxxxx',]
 ,
 ['xgxxxvxxxxxxxx',
 'x@x5       -kx',
 'C1M xxx xxYxxx',
 'x x4c+  1234kx', 
 'x2R xxx xxxvxx',
 'x i rk6      R',
 'x i xxxmMmMmMx',
 'c3m YkxMmMkMmx',
 'xxxxxxxxxxxxxx',]
];
var scale = 60;
var playerSpeed = 3;
var arrowCodes = {37: "left", 38: "up", 39: "right", 40 : "down", 32 : "space"};
var maxStep = 0.05;
var arrows = trackKeys(arrowCodes);
var lifeCount = 1;
var invulCount = 0;
var time = 1;
let actors = {
  "@": Player,
  "k": Key,
  "o": Monster,
  "-": Monster,
  "m": MagicalBlock,"M": MagicalBlock,
  "1": Spike,"2": Spike,"3": Spike,"4": Spike,"5": Spike,"6": Spike,"7": Spike,"8": Spike,
  "9": Spike,
  "c": Cannon,"C": Cannon,"V": Cannon,"v": Cannon,"c": Cannon,"r": Cannon,"R": Cannon,
  "n": Cannon,"N": Cannon,
  "l": LifePoution,
  '+': InvulPoution
}
function Level(plan){
  this.width = 0;
  plan.forEach((elem)=> {
    if(elem.length > this.width){
      this.width = elem.length;
    }
  })
  this.height = plan.length;
  this.grid = [];
  this.gateIsopen = false;
  this.actors = [];
  for(let y = 0; y < this.height; y++){
    var gridLine = [];  
    for(let x = 0; x < this.width; x++){
      var ch = plan[y][x];
      var Actor = actors[ch];
      if(Actor){
        this.actors.push(new Actor(new Vector(x, y), ch))
      }
      var fieldType = null;
      if(ch === "x"){
        fieldType = "wall"
      }
      else if(ch === "Y"){
        fieldType = "bush"
      }
      else if(ch === "g"){
        fieldType = "gate"
      }
      else if(ch === "i"){
        fieldType = "torn"
      }
      gridLine.push(fieldType)
    }
    this.grid.push(gridLine)
  }
  this.player = this.actors.filter(function(elem){
    return elem.type === "player"
  })[0]
  this.status = this.finishDelay = null
}
function Vector(x, y){
  this.x = x;
  this.y = y;
}
function MagicalBlock(pos, ch){
  this.pos = pos;
  this.size = new Vector(1,1);
  if(ch == 'm'){
    this.timer = 0
  }else{
    this.timer = 1.5
  }
}
function Bullet(pos, ch){
  this.pos = pos;
  this.ch = ch;
  this.size = new Vector(0.3, 0.3)
  if(ch == "c" || ch == "C"){
    this.speed = new Vector(1, 0)
  }
  if(ch == "V" || ch == "v"){
    this.speed = new Vector(0, 1)
  }
  if(ch == "r" || ch == "R"){
    this.speed = new Vector(-1, 0)
  }
  if(ch == "n" || ch == "N"){
    this.speed = new Vector(0, -1)
  }
}
function Cannon(pos, ch){
  this.ch = ch;
  this.pos = pos;
  this.size = new Vector(1, 1);
  if(ch == "c" || ch == "v" || ch == "r" || ch == "n"){
    this.timer = 0;
  }
  if(ch == "C" || ch == "V" || ch == "R" || ch == "N"){
    this.timer = 1.5;
  }

  
}
function Spike(pos, ch){
  this.pos = pos;
  this.size = new Vector(0, 0);
  this.timer = 3 - (ch/3)
  this.spiked = false;
}
function Player(pos){
  this.invul = false;
  this.pos = pos;
  this.size = new Vector(0.5, 0.8)
  this.speed = new Vector(0, 0);
}
function Key(pos){
  this.pos = pos.plus(new Vector(0.25, 0.25));
  this.size = new Vector(0.5, 0.5)
  this.speed = new Vector(0, 0);
}
function Monster(pos, ch){
  this.pos = pos.plus(new Vector(0, 0.2));
  this.size = new Vector(1, 0.8)
  if(ch === "o"){
    this.speed = new Vector(0, 2);
  }
  else if( ch === "-"){
    this.speed = new Vector(2, 0);
  }
}
function LifePoution(pos){
  this.pos = pos.plus(new Vector(0.2, 0.2));
  this.size = new Vector(0.6, 0.6);
  this.type = "life";
}
function InvulPoution(pos){
  this.pos = pos.plus(new Vector(0.2, 0.2));
  this.size = new Vector(0.6, 0.6);
  this.type = "invul";
}
function InvulPoution(pos){
  this.pos = pos.plus(new Vector(0.1, 0));
  this.size = new Vector(0.6, 0.6);
  this.type = "invul";
}
function Display(parrent,level){
  this.level = level;
  this.actorLayer = null;
  this.hudLayer = null;
  this.wrap = parrent.appendChild(createElem("div", "game"))
  this.wrap.appendChild(this.drawBackground())
  this.drawFrame()
}
function createElem(name,className){
  var elem = document.createElement(name);
  if(className){
    elem.className = className;
  }
  return elem;
}
function findOne(array, type){
  if(array.filter(function(elem) { return elem === type || elem.type === type}).length !=0){
    return true
  }
  else{
    return false
  }
}
function trackKeys(codes, level) {
  var pressed = Object.create(null);
  function handler(event) {
    if (codes.hasOwnProperty(event.keyCode)) {
      var down = event.type == "keydown";
      pressed[codes[event.keyCode]] = down;
      event.preventDefault();
    }
  }
  addEventListener("keydown", handler);
  addEventListener("keyup", handler);
  console.log(pressed)
  return pressed;
}
function runAnimation(frameFunc) {
  var lastTime = null;
  function frame(time) {   
    var stop = false;
    if (lastTime != null) {
      var timeStep = Math.min(time - lastTime, 100) / 1000;
      stop = frameFunc(timeStep) === false;
    }
    lastTime = time;
    if (!stop)
      requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
function runLevel(level, Display, andThen) {
  var display = new Display(document.body, level);
  runAnimation(function(step) {
    level.animate(display, step, arrows);
    display.drawFrame(step);
    if (level.isFinished()) {
      display.clear();
      if (andThen)
        andThen(level.status);
      return false;
    }
  });
}
function runGame(plans, Display) {
  function startLevel(n) {
    runLevel(new Level(plans[n]), Display, function(status) {
      if (status == "lost")
        startLevel(n);
      else if(status === "end"){
        var wrap = createElem("div", "endgame");
        wrap.innerHTML = "YOU LOSE!";
        document.body.appendChild(wrap);
      }
      else if (n < plans.length - 1)
        startLevel(n + 1);
      else{
        var wrap = createElem("div", "wingame");
        wrap.innerHTML = "YOU WIN!";
        document.body.appendChild(wrap);
      }
    });
  }
  startLevel(0);
}

Bullet.prototype.type = "bullet";
Spike.prototype.type = ""
Cannon.prototype.type = "cannon"
MagicalBlock.prototype.type = "Mblock"
Player.prototype.type = "player";
Player.direction = "right";
Key.prototype.type = "key";
Monster.prototype.type = "monster";

Level.prototype.destroy = function(obj){
    this.actors = this.actors.filter(function(elem) {
      return elem != obj
    })
}
Level.prototype.isFinished = function(){
  return this.status != null && this.finishDelay < 0
}
Level.prototype.collisionGrid = function(pos,size){
  var xStart = Math.floor(pos.x);
  var xEnd = Math.ceil(pos.x + size.x);
  var yStart = Math.floor(pos.y);
  var yEnd = Math.ceil(pos.y + size.y);
  var mass = [];
  for (var y = yStart; y < yEnd; y++){
    for(var x = xStart; x < xEnd; x++){
      var other = this.grid[y][x];     
      if(other){       
        mass.push(other)
      }
    }    
  }
  return mass;
}
Level.prototype.actorAt = function(actor) {
  var mass = [];
  for (var i = 0; i < this.actors.length; i++) {
    var other = this.actors[i];
    if (other != actor &&
        actor.pos.x + actor.size.x > other.pos.x &&
        actor.pos.x < other.pos.x + other.size.x &&
        actor.pos.y + actor.size.y > other.pos.y &&
        actor.pos.y < other.pos.y + other.size.y &&
        other.size.x != 0 && other.size.y != 0)
      mass.push(other)
  }
  if(mass.length != 0){
    return mass;
  }
};
Level.prototype.collisionBaC = function(pos, size){
  var xStart = Math.floor(pos.x);
  var xEnd = Math.ceil(pos.x + size.x);
  var yStart = Math.floor(pos.y);
  var yEnd = Math.ceil(pos.y + size.y);
  for (var i = 0; i < this.actors.length; i++) {
    var other = this.actors[i];
    if ((other.type === "Mblock" || other.type === "cannon") &&
        xEnd > other.pos.x &&
        xStart < other.pos.x + other.size.x &&
        yEnd > other.pos.y &&
        yStart < other.pos.y + other.size.y)
        return other;
  }
}
Level.prototype.playerTouched = function(type, other, display){
  if(findOne(other, "key")){
    this.actors = this.actors.filter(function(elem) {
      return elem != other[0]
    })
    if(!this.actors.some(function(elem) {return elem.type === "key"})){
      this.grid = this.grid.map(function(elem) {
       return elem.map(function(gridElem){
          if(gridElem === 'gate'){
            return 'opengate'
          }
          else{
            return gridElem
          }
        })
      })
      var table = document.getElementsByClassName("background")[0];
      table.parentNode.removeChild(table)
      display.wrap.appendChild(display.drawBackground());
      this.gateIsopen = true;
    }
  }
  if(findOne(other, "opengate")){
    this.status = 'win';
    this.finishDelay = 1;
  }
  if(findOne(other, "monster") || findOne(other, "spike") || 
  findOne(other, "Mblock") || findOne(other, "bullet")){
    if(this.player.invul){

    }
    else{
      if(lifeCount > 0){
        this.status = "lost";
        this.finishDelay = 1;
        lifeCount--;
        this.actors = this.actors.filter(function(elem) {
        return elem.type != "player"
      })
      }
      else{
        lifeCount--;
        this.status = "end"
      }
    }
  }
  if(findOne(other, "life")){
    if(lifeCount < 3){
      lifeCount++
    }
    this.actors = this.actors.filter(function(elem) {
      return elem != other[0]
    })
  }
  if(findOne(other, "invul")){
    if(invulCount < 3){
      invulCount++
    }
    this.actors = this.actors.filter(function(elem) {
      return elem != other[0]
    })
  }
}
Level.prototype.animate = function(display, step, keys){
  if(this.status != null){
    this.finishDelay -= step;
  }
  while (step > 0) {
    var thisStep = Math.min(step, maxStep);
    this.actors.forEach(function(actor) {
      if(actor.act){
      actor.act(thisStep, this, keys, display);
      }
    }, this);
    step -= thisStep;
  }
}
Display.prototype.clear = function() {
  this.wrap.parentNode.removeChild(this.wrap);
};
Display.prototype.scrollPlayerIntoView = function() {
  var width = this.wrap.clientWidth;
  var height = this.wrap.clientHeight;
  var margin = width / 3;

  // The viewport
  var left = this.wrap.scrollLeft, right = left + width;
  var top = this.wrap.scrollTop, bottom = top + height;
  var player = this.level.player;
  var center = player.pos.plus(player.size.times(0.5))
                 .times(scale);

  if (center.x < left + margin)
    this.wrap.scrollLeft = center.x - margin;
  else if (center.x > right - margin)
    this.wrap.scrollLeft = center.x + margin - width;
  if (center.y < top + margin)
    this.wrap.scrollTop = center.y - margin;
  else if (center.y > bottom - margin)
    this.wrap.scrollTop = center.y + margin - height;
    
};
Display.prototype.drawBackground = function(){
  var table = createElem("table", "background")
  table.style.width = this.level.width * scale + "px"
  this.level.grid.forEach(element => {
    var row = table.appendChild(createElem("tr"))
    row.style.height = scale + "px"
    element.forEach(function(elem) {
      row.appendChild(createElem("td", elem))
    })
  });
  return table;
}
Display.prototype.drawActors = function(){
  
  var wrap = createElem("div");
  this.level.actors.forEach(function(elem){
    var rect = wrap.appendChild(createElem("div", "actor " + elem.type))
    if(elem.direction){
      var rect = wrap.appendChild(createElem("div", "actor " + elem.type + " " + elem.direction))
    }
    if(elem.invul){
      var rect = wrap.appendChild(createElem("div", "actor " + elem.type + " " + elem.direction + " invull"))
    }
    rect.style.width = elem.size.x * scale +"px";
    rect.style.height = elem.size.y * scale +"px";
    rect.style.left = elem.pos.x * scale +"px";
    rect.style.top = elem.pos.y * scale +"px";   
  })
  return wrap;
}
Display.prototype.drawFrame = function(){
  if(this.actorLayer){
    this.wrap.removeChild(this.actorLayer)
  }
  this.actorLayer = this.wrap.appendChild(this.drawActors())
  this.drawHUD()
  this.scrollPlayerIntoView();
}
Display.prototype.drawHUD = function(){
  var hud = document.getElementsByClassName('hud')[0];
  var game = document.getElementsByClassName('game')[0];
  if(hud){
      game.removeChild(hud)
  }
  var wrap = createElem("div", "hud");
  for(let i = 0 ; i < lifeCount ; i++){
    var rect = wrap.appendChild(createElem('div', "life"));
    rect.style.width = 20 +"px";
    rect.style.height = 20 +"px";
  }
  for(let i = 0 ; i < invulCount ; i++){
    var rect = wrap.appendChild(createElem('div', "invul"));
    rect.style.width = 20 +"px";
    rect.style.height = 20 +"px";
  }
  wrap.style.top =  0 + "px"
  wrap.style.left=  0 + "px"
  game.appendChild(wrap)
}
Bullet.prototype.act = function(step, level){
  if(this.speed.x === 1 || this.speed.x === -1){
    var motion = new Vector(this.speed.x * step,0)
    var newPos = this.pos.plus(motion)
    var col = level.collisionGrid(this.pos, this.size);
    var x = level.collisionBaC(this.pos, this.size);
    if(findOne(col,"wall")){
      level.destroy(this);
    }
    else if(x){
      level.destroy(this);
    }
    else{
      this.pos = newPos
    }
    this.pos = newPos
  }
  else {
    var motion = new Vector(0,this.speed.y * step)
    var newPos = this.pos.plus(motion)
    var col = level.collisionGrid(this.pos, this.size);
    var x = level.collisionBaC(this.pos, this.size);
    if(findOne(col, "wall")){
      level.destroy(this);
    }
    else if(x){
      level.destroy(this);
    }
    else{
      this.pos = newPos
    }
    this.pos = newPos
  }
  
}

Vector.prototype.plus = function(other){
  return new Vector(this.x + other.x,this.y + other.y)
}
Vector.prototype.times = function(factor) {
  return new Vector(this.x * factor, this.y * factor);
};

Player.prototype.moveX = function(step, level, keys){
  this.speed.x = 0
  if(keys.right){
    this.speed.x +=playerSpeed;
    this.direction = 'right'
  }
  if(keys.left){
    this.speed.x -=playerSpeed;
    this.direction ='left';
  }
  var motion = new Vector(this.speed.x * step,0)
  var newPos = this.pos.plus(motion)
  var obstacle = level.collisionGrid(newPos, this.size);
  var bac = level.collisionBaC(newPos, this.size);
  if(findOne(obstacle, "wall") || findOne(obstacle, "gate")){

  }
  else if(bac){

  }
  else if(findOne(obstacle, 'bush')){
    this.pos = this.pos.plus(new Vector(this.speed.x * step / 5, 0))
  }
  else if(findOne(obstacle, 'opengate')){
    level.status = 'win';
    level.finishDelay = 1;
    level.actors = level.actors.filter((elem)=> {
      return elem != this
    })
  }
  else if(findOne(obstacle, "torn")){
    if(lifeCount > 0){
      if(this.invul){

      }
      else{
        lifeCount--;
        level.status = "lost";
        level.finishDelay = 1;
        level.actors = level.actors.filter(function(elem) {
        return elem.type != "player"
      })
      }
    }
    else{
      lifeCount--;
      level.status = "end"
    }
  }
  else{
    this.pos = newPos;
  }  
}
Player.prototype.moveY = function(step, level, keys){
  this.speed.y = 0
  if(keys.up){
    this.speed.y -=playerSpeed;
  }
  if(keys.down){
    this.speed.y +=playerSpeed;
  }
  var motion = new Vector(0,this.speed.y * step)
  var newPos = this.pos.plus(motion)
  var obstacle = level.collisionGrid(newPos, this.size);
  var bac = level.collisionBaC(newPos,this.size);
  if(findOne(obstacle, "wall") || findOne(obstacle, "gate")){

  }
  else if(bac){

  }
  else if(findOne(obstacle, 'bush')){
    this.pos = this.pos.plus(new Vector(0,this.speed.y * step / 5))
  }
  else if(findOne(obstacle, 'opengate')){
    level.status = 'win';
    level.finishDelay = 1;
    level.actors = level.actors.filter((elem)=> {
      return elem != this
    })
  }
  else if(findOne(obstacle, "torn")){
    if(lifeCount >0){
      if(this.invul){

      }
      else{
        level.status = "lost";
        lifeCount--;
        level.finishDelay = 1;
        level.actors = level.actors.filter(function(elem) {
        return elem.type != "player"
      })
      }
    }
    else{
      lifeCount--;
      level.status = "end"
    }
  }
  else{
    this.pos = newPos;
  }  
}
Player.prototype.act = function(step, level, keys, display){ 
  this.moveX(step,level, keys)
  this.moveY(step,level, keys)
  if(this.invul === false){
    if(keys.space){
      if(invulCount){
        invulCount--;
        this.invul = true;
        setTimeout(()=>{
          this.invul = false
        },2000)
      }
    }
  }
  var other = level.actorAt(this)
  if(other){
    level.playerTouched(other.type, other, display)
  } 
}
MagicalBlock.prototype.act = function(step){
  this.timer += step;
  if(this.timer > 3){
    if(this.type === "Mblock"){
      this.type = "OMblock"
      this.timer = 0;
      this.size = new Vector(0, 0)
    }
    else{
      this.type = "Mblock"
      this.timer = 0;
      this.size = new Vector(1, 1)
    }
  }
}
Cannon.prototype.act = function(step, level){
  
  this.timer += step;
  if(this.timer >3){
    if(this.ch == "c" || this.ch == "C"){
      level.actors.push(new Bullet(this.pos.plus(new Vector(1, 0.3)), this.ch))
      this.timer = 0
    }
    else if(this.ch == "v" || this.ch == "V"){
      level.actors.push(new Bullet(this.pos.plus(new Vector(0.3, 1)), this.ch))
      this.timer = 0
    }
    else if(this.ch == "r" || this.ch == "R"){
      level.actors.push(new Bullet(this.pos.plus(new Vector(-0.3, 0.3)), this.ch))
      this.timer = 0
    }
    else if(this.ch == "n" || this.ch == "N"){
      level.actors.push(new Bullet(this.pos.plus(new Vector(0.3, -0.3)), this.ch))
      this.timer = 0
    }
  }
}
Spike.prototype.act = function(step){
  if(this.spiked){
    this.timer += step;
    if(this.timer > 1){
      this.type = ''
      this.spiked = false;
      this.size = new Vector(0, 0)
      this.timer = 0;
    }
  }
  else{
    this.timer += step;
    if(this.timer > 3){
      this.type = 'spike'
      this.size = new Vector(1, 1)
      this.spiked = true;
      this.timer = 0;
    }
  }
}
Monster.prototype.act = function(step, level){
  
  var motion;
  var newPos;
  var bac = level.collisionBaC(this.pos, this.size)
  if(this.speed.x){
    motion = new Vector(this.speed.x * step, 0)
    newPos = this.pos.plus(motion)
  }
  else{
    motion = new Vector(0,this.speed.y * step)
    newPos = this.pos.plus(motion)
  }
  if(level.collisionGrid(newPos, this.size).filter(function(elem) 
  {return elem === "wall" || elem === "gate" || elem === "opengate"}).length !=0){
    this.speed = this.speed.times(-1);
  }
  else if(bac){
      if(this.speed)
      this.speed = this.speed.times(-1);      
      motion = new Vector(0,this.speed.y * step)
      newPos = this.pos.plus(motion)
      this.pos = newPos
  }
  else{
    this.pos = newPos
  }
}
runGame(GAME_LEVELS, Display);
setInterval(() => {
  if(lifeCount>=0){
    document.getElementById("timer").innerText = time
  time++;
  }
}, 1000);