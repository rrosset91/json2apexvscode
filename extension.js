const vscode = require("vscode");
const editor = vscode.window.activeTextEditor;
const {spawn} = require('child_process');

async function json2apex() {
  const userSelection = editor.document.getText(editor.selection);
  const className = await vscode.window.showInputBox({
    placeHolder: "Enter the generated class name"
  });
  const createTest = await vscode.window.showInputBox({
    placeHolder: "Generate class with tests? (Y/N - Default N)"
  });
  
  let params = ['script.py'];
  if(className === ''){
	  showMessage('error', 'Classname cannot be empty');
	  return;
	}
  if(userSelection === '' || isInvalidSelection(userSelection)){
	  showMessage('error', 'Please select a valid JSON content and try again');
	  return;
	} 
  createTest == '' ? 'N':'Y';	
  params.push(className);
  params.push(createTest);
  params.push(userSelection);

  let response = await callPython(params).catch((e)=>{
	  showMessage('error', `Something went wrong...${e.message}`);
  });
  if (editor) {
	editor.edit((selectedText) => {
		selectedText.replace(editor.selection, response);
	})
}
}

async function callPython(params){
	let dataToSend;

	const python = spawn('python', params);
	python.stdout.on('data', function (data) {
	 dataToSend = data.toString();
	});
	
	python.on('close', () => {
	let response = dataToSend;
	return response;
	});
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
	try {
        JSON.parse(input);
    } catch (e) {
        return true;
    }
    return false;
}

function activate(context) {
  // this code runs whenever your click 'Create Gist' from the context menu in your browser.
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
 
