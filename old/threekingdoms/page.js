<!--

ie = document.all? true : false
//=======================
//=======================
//=======================
isCharacterInit = false
character = new Array()
characterID = new Array()
currentCharacter = null
currentRequest = null
nextParagraph = 0
currentPoint = 0
speechLength = 0
arrSpeech = null
isPlaying = false

//=======================
//=======================
//=======================
function initPage()
{
	if (ie) speechInit()
}

//=======================
//=======================
//=======================
function speechInit()
{
	var t = divPageHead.innerText + '\15\12'
	t += divPage.innerText
	arrSpeech = t.split(/\15\12/)
	speechLength = arrSpeech.length
}

//==============================================
function initCharacter()
{
	// This function start the characters.
	// This is a standard way to activate agents.
	// Connect the AgentControl first.
	// Load the necessary characters next.
	// Necessary for IE3.
	AgentControl.Connected = true
	
	// The application initiates one standard character first.
	loadCharacter('merlin')
	// Get the current character.
	currentCharacter = character['merlin']
}

//==============================================
function loadCharacter(id)
{
	// This function loads a character.
	// The locations of the animation files are different
	// from win95 to winnt.
	// The value of the client OS is in navigator.userAgent.
	var oS = navigator.userAgent.toLowerCase()
	var charsPath = ''
	if ((oS.indexOf("95")!=-1) || (oS.indexOf("98")!=-1)) charsPath = 'c:\\windows\\msagent\\chars\\'
	else charsPath = 'c:\\winnt\\msagent\\chars\\'

	AgentControl.characters.load(id, charsPath + id + '.acs')
	character[id] = AgentControl.characters.character(id)
	character[id].languageId = 0x0409
	// After a successful load, the character id becomes true.
	// This character is available for future use.
	characterID[id] = true
}

//=======================
function speechControl()
{
	if (!ie)
	{
		alert("Please use Microsoft Internet Explorer in order to listen to a cartoon read the book to you.")
		return
	}
	
	if (frmMain.butSpeech.value == 'Read')
	{
		var t = ''
		if (!isCharacterInit)
		{
			t += '<OBJECT ID="AgentControl" WIDTH=0 HEIGHT=0'
			t += '   CLASSID="CLSID:D45FD31B-5C6E-11D1-9EC1-00C04FD7081F"'
			t += '   CODEBASE="#VERSION=2,0,0,0">'
			t += '</OBJECT>'
			t += '<script for="AgentControl" event="RequestComplete(request)">'
			t += '	if (request == currentRequest) speechContinue()'
			t += '</script>'
			divAgent.innerHTML = t

			// Initialize the characters only when the control is available.
			if (recommendCharacter() == false)
			{
				status = 'Done'
				return
			}
			else initCharacter()

			isCharacterInit = true
		}

		t = ''
		t += '<font color=black>'
		t += '<input type=button value="Stop" onclick=speechStop()> '
		t += '<input type=radio name=radReadFrom value=0 onclick=speechChangeParagraph(0) checked>0 '
		t += '<input type=radio name=radReadFrom value=1 onclick=speechChangeParagraph(1)>1 '
		t += '<input type=radio name=radReadFrom value=2 onclick=speechChangeParagraph(2)>2 '
		t += '<input type=radio name=radReadFrom value=3 onclick=speechChangeParagraph(3)>3 '
		t += '<input type=radio name=radReadFrom value=4 onclick=speechChangeParagraph(4)>4 '
		t += '<input type=radio name=radReadFrom value=5 onclick=speechChangeParagraph(5)>5 '
		t += '<input type=radio name=radReadFrom value=6 onclick=speechChangeParagraph(6)>6 '
		t += '<input type=radio name=radReadFrom value=7 onclick=speechChangeParagraph(7)>7 '
		t += '<input type=radio name=radReadFrom value=8 onclick=speechChangeParagraph(8)>8 '
		t += '<input type=radio name=radReadFrom value=9 onclick=speechChangeParagraph(9)>9 '
		t += '<input type=button value="Speak" onclick=speechStart()> '
		t += '<select name=selChar onchange=speechChangeChar()> '
		t += '	<option>Merlin'
		t += '	<option>Genie'
		t += '	<option>Peedy'
		t += '</select>'
		t += '</font>'
		divSpeech.innerHTML = t
		frmMain.butSpeech.value = 'Hide'
	}
	else
	{
		divSpeech.innerHTML = ''
		frmMain.butSpeech.value = 'Read'
	}
}

//=======================
function speechChangeParagraph(num)
{
	currentPoint = num
	nextParagraph = Math.floor(speechLength / 10 * currentPoint)
}

//=======================
function speechChangeChar()
{
	var t = frmMain.selChar.selectedIndex
	var c = new Array('merlin','genie','peedy')

	if (characterID[c[t]])
	{
		var cn = currentCharacter.name
		if (cn != c[t]) currentCharacter.hide()
		currentCharacter = character[c[t]]
	}
	else
	{
		currentCharacter.hide()
		loadCharacter(c[t])
		currentCharacter = character[c[t]]
	}
}

//=======================
function speechStart()
{
	isPlaying = true
	setCharacterVisible()
	currentCharacter.play('greet')
	currentCharacter.play('restpose')
	speechContinue()
}

//=======================
function speechContinue()
{
	var t
	if (!isPlaying) return
	setCharacterVisible()
	if (nextParagraph >= speechLength)
	{
		t = '\\pau=1000\\ I am ' + currentCharacter.name + ', your story teller.'
		currentCharacter.speak(t)
		currentCharacter.hide()
		currentPoint = 0
		frmMain.radReadFrom[currentPoint].checked = true
		speechChangeParagraph(currentPoint)
	}
	else
	{
		t = speechGetParagraph()
		currentRequest = currentCharacter.speak(t)
	}
}

//=======================
function speechStop()
{
	isPlaying = false
	for (var e in character)
	{
		character[e].hide()
	}
}

//=======================
function speechGetParagraph()
{
	var t = ''
	var b = nextParagraph
	for (var i = b; i < speechLength; i++)
	{
		t = arrSpeech[i]
		nextParagraph++
		t = t.replace(/\*/gi,'')
		if (t.indexOf('[e]') < 0)
		{
			if (nextParagraph >= (speechLength / 10 * (currentPoint + 1)))
			{
				if (currentPoint < 9)
				{
					currentPoint++
					frmMain.radReadFrom[currentPoint].checked = true
				}
			}
			break
		}
	}
	
	if (t != '')
	{
		// Add ! to question.
		if (Math.random() < 0.8) t = t.replace(/\?"/gi,'!?"')
		
		// Add ! to sentence.
		var e = t.length
		var s = 0
		var c = 0
		var tt = ''
		for (var i = 0; i < 200; i++)
		{
			c = t.indexOf('.',c)
			if (c > 0)
			{
				tt += t.slice(s,c) + ((Math.random() < 0.7)? '!' : '.')
				c++
				s = c
				if (c + 1 >= e) break
			}
			else
			{
				tt += t.slice(s)
				break
			}
		}

		// Add pause.		
		t = tt
		t = t.replace(/---/gi,'-.-')
		t = t.replace(/\(/gi,'.(')
		t = t.replace(/:/gi,'.:')
		t = t.replace(/, "/gi,'. "')
	}

return t}

//=======================
function setCharacterVisible()
{
	if (currentCharacter.visible == false) currentCharacter.show()
}

//=======================
function recommendCharacter()
{
	var t = false
	if (AgentControl.characters) t = true
	else
	{
		var m = 'You need to download and install Microsoft Agent, in order to listen to a cartoon read the book for you.\nPlease go to http://threekingdoms.com/download.htm for instructions.'
		alert(m)
	}
return t}

//=======================
//=======================
//=======================
function yes(){}

//-->