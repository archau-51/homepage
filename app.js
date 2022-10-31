document.getElementById('nolol').value=''
function lmao() {
    document.getElementById('why2').setAttribute("width", "2.8vw");
}
function lmao3() {
    document.getElementById('why').setAttribute("width", "100%");
}
document.getElementById('lmao').addEventListener("click", function () {
    currentfontsize = 20;
    gsap.to('#why', { duration: 0.1, position:'absolute', pointerEvents:'none' })
    gsap.to('#use', {filter:'blur(5px)', y:20})
    document.getElementById('nolol').style.pointerEvents = 'all'
    gsap.to('#nolol', {opacity:1})
    gsap.to('.comp', { height: "5vh", backgroundImage: "linear-gradient(rgb(255,255,255), rgb(255,255,255)), url(" + imglol + ")", boxShadow: '0px 0px 0px black', marginBottom: "40%", duration: 0.8, onComplete: lmao })
    gsap.to('#why2', { duration: 0.1, position:'relative' })
    gsap.to('#why2', { duration: 0, delay: 0.5, pointerEvents: 'all' })
    gsap.to('#why2', { delay: 0.6 })
    gsap.to('#why2', { duration: 0.5, opacity: 1, delay:1})
    gsap.to('#use', {opacity:1, pointerEvents:'all', delay:0.75, filter:'blur(0px)', y:0})
    document.getElementById('nolol').focus()
});
gsap.to('.comp', { opacity: 1, duration: 1.5 })
gsap.fromTo('.comp', {x:-10, filter:'blur(10px)'}, {x:0,filter:'blur(0px)'})
var swatches
var cols = []
imglol = "./images/" + Math.floor(Math.random() * 25) + ".png"
console.log(imglol)
document.getElementById('imgs').src = imglol
gsap.to('.comp', { duration: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0), rgba(255,255,255,0)), url(' + imglol + ')' })
document.getElementById('imgs').addEventListener('load', function () {
    var vibrant = new Vibrant(document.getElementById('imgs'));
    swatches = vibrant.swatches()
    for (var swatch in swatches) {
        if (swatches.hasOwnProperty(swatch) && swatches[swatch]) {
            console.log(swatch, swatches[swatch].getHex())
            cols.push(swatches[swatch].getHex())
        }
    }
    if (imglol === './images/40.png') {
        document.getElementById('why').style.stroke = cols[4]
        document.getElementById('why2').style.stroke = 'grey'
    }
    else {
        document.getElementById('why').style.stroke = cols[0]
        document.getElementById('why2').style.stroke = 'grey'
    }
})
if(document.getElementById("nolol").value.length == 0)
function lmao2() {
    //document.getElementById('nolol').value=''
    currentfontsize = 20;
    document.getElementById('nolol').style.pointerEvents = 'none'
    gsap.to('#why2', { duration: 0.1, opacity:0 ,pointerEvents: 'none', position:'absolute' })
    gsap.to('#why', { duration: 0.1, position:'relative', pointerEvents:'all' })
    gsap.to('#nolol', {opacity:0})
    gsap.to('#use', {opacity:0, pointerEvents:'none', y:20})
    gsap.to('.comp', { height: "85vh", backgroundImage: "linear-gradient(rgba(255,255,255,0), rgba(255,255,255,0)), url(" + imglol + ")", boxShadow: '0px 0px 25px black', marginBottom: "0", duration: 0.8,onComplete: lmao3  })
}
function changefontsize() {
    var myInput = document.getElementById('nolol');
    if(isOverflown(myInput)) {
      while (isOverflown(myInput)){
      currentfontsize--;
      myInput.style.fontSize = currentfontsize + 'px';
      }
    }else {
      currentfontsize = 20;
      myInput.style.fontSize = currentfontsize + 'px';
      while (isOverflown(myInput)){
      currentfontsize--;
      myInput.style.fontSize = currentfontsize + 'px';
      }
    }	
  }
  
  function isOverflown(element) {
      return element.scrollWidth > element.clientWidth;
  }
  document.getElementById('nolol').addEventListener("keydown", function (e) {
    if (e.code === "Enter") {  //checks whether the pressed key is "Enter"
        validate(e);
    }
});
function format(text){
    var text1 = text.replace(/%/g,'%25')
    var text2 = text1.replace(/\//g,'%2F')
     var text3 = text2.replace(/\+/g,'%2B')
     var text4 = text3.replace(/\#/g,'%23')
     var text5 = text4.replace(/\$/g,'%24')
     var text6 = text5.replace(/&/g,'%26')
     var text7 = text6.replace(/@/g,'%40')
     var text8 = text7.replace(/;/g,'%3B')
     var text9 = text8.replace(/\?/g,'%3F')
     var text10 = text9.replace(/=/g,'%3D')
     return text10
}
function validate(e) {
    var query = format(e.target.value);
    location.replace('http://google.com/search?q='+query);
}
//document.getElementById('nolol').onkeydown = 
function sug() {
    var rawFile = new XMLHttpRequest();
    rawFile.open("GET", "https://corsanywhere.herokuapp.com/https://suggestqueries.google.com/complete/search?client=chrome&q=" + format(document.getElementById('nolol').value), true);
    rawFile.onreadystatechange = function() {
      if (rawFile.readyState === 4) {
        var allText = rawFile.responseText;
        let position = allText.search("]");
        let position2 = allText.indexOf('[', 1)
        let result = allText.slice(0, position+1)
        let result2 = result.slice(position2+1, -1)
        var sugges = result2.split(",");
        console.log(sugges)
        var ins= ""
        if (sugges.length > 0){
        for (x in sugges){ins = ins +"&nbsp&nbsp&nbsp" +sugges[x] + '<hr>'}
        document.getElementById("use").innerHTML = ins;
       // document.getElementById("use").style.height = x*6.6+'vh'
      }
      }
    }
    rawFile.send();
  }