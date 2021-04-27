const fetch = require("node-fetch");
const vscode = require("vscode");
let editor = vscode.window.activeTextEditor;
let outputTerminal = vscode.window.createOutputChannel("JSON2Apex");
let className;
let createTest;
let auraEnabled;
let parseMethod;
let params = {};
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

  try {
    let createTestOption = validateInputs(createTest, 'test')
    createTest = createTestOption.createTest;
  } catch (error) {
    showMessage('error', error.message);
    return;
  }
  auraEnabled = await vscode.window.showInputBox({
    placeHolder: "Use @AuraEnabled? (Y/N - Default Y)"
  });
  try {
    let auraOption = validateInputs(auraEnabled, 'aura');
    auraEnabled = auraOption.auraEnabled;
  } catch (error) {
    showMessage('error', error.message);
    return;
  }
  parseMethod = await vscode.window.showInputBox({
    placeHolder: "Generate Parse Method? (Y/N - Default N)"
  });
  try {
    let parseOption = validateInputs(parseMethod, 'parse');
    parseMethod = parseOption.parseMethod;
  } catch (error) {
    showMessage('error', error.message);
    return;
  }
  outputTerminal.show();
  params.className = className;
  params.generateTest = createTest;
  params.auraEnabled = auraEnabled;
  params.parseMethod = parseMethod;
  params.userSelection = userSelection;
  outputTerminal.appendLine('Process started.Please stand by...')
  submitForConversion(params).catch((e)=>{
	  showMessage('error', `Something went wrong...${e.message}`);
  });
}

async function submitForConversion(params){
  let response = await fetch(`https://zg2y6bzug6.execute-api.us-east-1.amazonaws.com/dev/json2apex?className=${params.className}&generateTest=${params.generateTest}&auraEnabled=${params.auraEnabled}&parseMethod=${params.parseMethod}`, {
        method: 'POST',
        mode: 'cors',
        body: JSON.stringify({jsonContent: JSON.stringify(params.userSelection)}),
        headers: {
          'Content-Type': 'application/json',
          'Accept':'*/*'
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
function validateInputs(value, key){
  value = value.toUpperCase();
  let validInputs = {};

  if(key =='aura'){
  if(value == '' || value == 'Y'){
    validInputs.auraEnabled = true
  }else if(value == 'N'){
    validInputs.auraEnabled = false
  }else{
    throw new Error('Invalid input for auraEnabled. Use Y, N or Enter for default (Y)');
  }
}

if(key == 'test'){
  if(value == '' || value == 'N'){
    validInputs.createTest = false
  }else if(value == 'Y'){
    validInputs.createTest = true
  }else{
    throw new Error('Invalid input for createTest. Use Y, N or Enter for default (N)');
  }
}

if(key == 'parse'){
  if(value == '' || value == 'N'){
    validInputs.parseMethod = false
  }else if(value == 'Y'){
    validInputs.parseMethod = true
  }else{
    throw new Error('Invalid input for Parse Method. Use Y, N or Enter for default (N)');
  }
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
 
