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
  createTest = validateInputs(createTest).createTest;
  try {
    createTest = validateInputs(createTest).createTest;
  } catch (error) {
    showMessage('error', error.message);
    return;
  }
  auraEnabled = await vscode.window.showInputBox({
    placeHolder: "Use @AuraEnabled? (Y/N - Default Y)"
  });
  try {
    auraEnabled = validateInputs(auraEnabled).auraEnabled;
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
  let response = await fetch(`https://json2apexpy.herokuapp.com/json2apex?className=${params.className}&generateTest=${params.generateTest}&auraEnabled=${params.auraEnabled}`, {
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
function validateInputs(aura, test){
  let validInputs = {};
  aura = aura.toUpperCase();
  test = test.toUpperCase();
  if(aura == '' || aura == 'Y'){
    validInputs.auraEnabled = true
  }else if(aura == 'N'){
    validInputs.auraEnabled = false
  }else{
    throw new Error('Invalid input for auraEnabled. Use Y, N or Enter for default (Y)');
  }
  if(test == '' || test == 'N'){
    validInputs.createTest = false
  }else if(test == 'Y'){
    validInputs.createTest = true
  }else{
    throw new Error('Invalid input for createTest. Use Y, N or Enter for default (N)');
  }
  return validInputs;
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
 
