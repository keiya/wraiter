import * as vscode from 'vscode';
import axios from 'axios';

const PREPEND_TEXT_KEY = 'prependText';

export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand('wraiter.gpt', async () => {
		await processCommand(context, true);
	});

	let disposableShortcut = vscode.commands.registerCommand('wraiter.gpt.shortcut', async () => {
		await processCommand(context, false);
	});

	context.subscriptions.push(disposable, disposableShortcut);
}

async function processCommand(context: vscode.ExtensionContext, promptForInput: boolean) {
	const editor = vscode.window.activeTextEditor;
	if (!editor) return;

	const document = editor.document;
	const selection = editor.selection;

	// Get the word within the selection
	const word = document.getText(selection);

	// Save the initial selection
	const initialSelection = new vscode.Selection(selection.start, selection.end);

	// Get previous prepend text
	const previousPrependText = context.globalState.get<string>(PREPEND_TEXT_KEY, '');

	let prependText = previousPrependText;
	if (promptForInput) {
		// Prompt User for prepend text
		const userInput = await vscode.window.showInputBox({
			prompt: 'Enter the prepend text',
			value: previousPrependText,
		});
		if (userInput !== undefined) {
			prependText = userInput;
			context.globalState.update(PREPEND_TEXT_KEY, userInput);
		}
	}

	const config = vscode.workspace.getConfiguration('wraiter');
	const apiKey = config.get('openaiApiKey', '');

	await queryOpenAI(editor, initialSelection, prependText + '\n\n' + word, apiKey);
}

async function queryOpenAI(editor: vscode.TextEditor, initialSelection: vscode.Selection, query: string, apiKey: string) {
	const config = vscode.workspace.getConfiguration('wraiter');
	const selectionType = config.get<string>('selectionType', 'initial'); // Ensure that the selectionType is a string

	// Call GPT-3 API with selected text
	const messages = [{'role': 'user', 'content': query}];
	console.log(messages)
	axios.post('https://api.openai.com/v1/chat/completions', {
	  "model": "gpt-3.5-turbo-16k",
	  messages
	}, {
	  headers: {
		'Authorization': `Bearer ${apiKey}`
	  }
	}).then(response => {
	  console.log(response);
	  const text = response.data.choices[0].message.content;
	  // Insert text on the next line after the cursor
	  editor.edit(editBuilder => {
		const position = new vscode.Position(editor.selection.end.line + 1, 0);
		editBuilder.insert(position, '\n' + text);
	  }).then(() => {
		let newPosition = editor.selection.end; // Get the end position of the editor after inserting the text
		// Decide which text to select based on the user's configuration
		switch(selectionType) {
		  case 'initial':
			editor.selection = initialSelection;
			break;
		  case 'response':
			editor.selection = new vscode.Selection(newPosition.translate(-1), newPosition); // Select the response text
			break;
		  case 'both':
			editor.selection = new vscode.Selection(initialSelection.start, newPosition); // Select both initial and response text
			break;
		  case 'none':
			editor.selection = new vscode.Selection(newPosition, newPosition); // Select none
			break;
		}
	  });
	}).catch(error => {
	  console.error(error);
	  vscode.window.showErrorMessage(`Failed to call GPT-3: ${error.message}`);
	});
  }



export function deactivate() {}
