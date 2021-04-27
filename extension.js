const fetch = require("node-fetch");
const vscode = require("vscode");
let editor = vscode.window.activeTextEditor;
let outputTerminal = vscode.window.createOutputChannel("JSON2Apex");
let className;
let createTest;
let auraEnabled;
let params = {};
let requestBody = {};
async function json2apex() {
  let userSelection = editor.document.getText(editor.selection);
  if(isInvalidSelection(userSelection)){
	  showMessage('error', 'Please select a valid JSON content and try again');
	  return;
	} 

  className = await vscode.window.showInputBox({
    placeHolder: "Enter the generated class name"
  });
  if(className === ''){
	  showMessage('error', 'Classname cannot be empty');
	  return;
	}

  createTest = await vscode.window.showInputBox({
    placeHolder: "Generate class with tests? (Y/N - Default N)"
  });
  createTest = createTest.toUpperCase();
  createTest = createTest == '' ? false : createTest
  if(createTest === 'Y' || createTest === 'y'){
    createTest = true;
  }
  if(createTest === 'F'){
    createTest = false;
  }

  auraEnabled = await vscode.window.showInputBox({
    placeHolder: "Use @AuraEnabled? (Y/N - Default Y)"
  });
  auraEnabled = auraEnabled.toUpperCase();
  auraEnabled = auraEnabled == '' ? true : auraEnabled
  
  if(auraEnabled === 'Y'){
    auraEnabled = true;
  }
  if(auraEnabled === 'F'){
    auraEnabled = false;
  }
  
  try {
    isValidInput(auraEnabled, createTest); 
  } catch (error) {
    showMessage('error', error.message);
    return;
  }
  requestBody.jsonContent = String(userSelection)
  outputTerminal.show();
  createTest == '' ? 'N':createTest;	
  auraEnabled == '' ? 'Y':auraEnabled;	
  params.className = className;
  params.generateTest = createTest;
  params.auraEnabled = auraEnabled;
  outputTerminal.appendLine('Process started.Please stand by...')
  
  submitForConversion(params).catch((e)=>{
	  showMessage('error', `Something went wrong...${e.message}`);
  });
}

async function submitForConversion(params){
  let response = await fetch(`https://json2apexpy.herokuapp.com/json2apex?className=${params.className}&generateTest=${params.generateTest}&jsonContent=${params.jsonContent}&auraEnabled=${params.auraEnabled}`, {
        method: 'GET',
        mode: 'cors',
        body: requestBody,
        headers: {
          'Content-Type': 'application/json'
        },
    }).catch((e)=>{
      showMessage('error', `Something went wrong...${e.message}`);
    })
  let treatedResponse = await response.json();
  outputTerminal.appendLine('Response captured successfully...')
  let replacementText;
  if(params.generateTest){
    replacementText = treatedResponse.wrapperClass+'\n\n'+treatedResponse.testClass;
  }else{
    replacementText = treatedResponse.wrapperClass
  }
  outputTerminal.appendLine('Converting data...')
  if (editor) {
    editor.edit((selectedText) => {
      selectedText.replace(editor.selection, replacementText);
    })
    outputTerminal.appendLine('Done: !JSON replaced with the generated wrapper class content!')
    showMessage('success', 'JSON conversion completed successfully');
  }
}

function showMessage(context, content){
	switch (context) {
		case 'success':
			vscode.window.showInformationMessage(content);
			break;
		case 'warning':
			vscode.window.showWarningMessage(content);
			break;
		case 'error':
			vscode.window.showErrorMessage(content);
			break;
		default:
			break;
	}
}

function isInvalidSelection(input){
  if(input == '') return true;
	try {
      JSON.parse(JSON.stringify(input));
      return false;
    } catch (e) {
      return true;
    }
}

function isValidInput(aura, test){
  let validAura = false;
  let validTest = false;
  if(aura === true || aura === false){
    validAura = true;
  }
  if(test === true || test === false){
    validTest = true;
  }
  if(!validAura){
    throw new Error(`Aura ${aura}`);
  }
  if(!validTest){
    throw new Error(`Test ${test}`);
  }
}

function activate(context) {
  let disposable = vscode.commands.registerCommand(
    "extension.json2apex",
    function() {
      json2apex();
    }
  );

  context.subscriptions.push(disposable);
}
exports.activate = activate;

function deactivate() {}
exports.deactivate = deactivate;
 
