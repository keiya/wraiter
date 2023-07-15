import * as vscode from 'vscode';
import axios from 'axios';

const PREPEND_TEXT_KEY = 'prependText';

export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand('wraiter.gpt', async () => {
		const editor = vscode.window.activeTextEditor;
		if (editor) {
			const document = editor.document;
			const selection = editor.selection;

			// Get the word within the selection
			const word = document.getText(selection);

			// Save the initial selection
			const initialSelection = new vscode.Selection(selection.start, selection.end);

			// Get previous prepend text
			const previousPrependText = context.globalState.get<string>(PREPEND_TEXT_KEY, '');

			// Prompt User for prepend text
			const userInput = await vscode.window.showInputBox({
				prompt: 'Enter the prepend text',
				value: previousPrependText,
			});

			if (userInput) {
				context.globalState.update(PREPEND_TEXT_KEY, userInput);
				await queryOpenAI(editor, initialSelection, userInput + '\n\n' + word);
			}
		}
	});

	let disposableShortcut = vscode.commands.registerCommand('wraiter.gpt.shortcut', async () => {
		const editor = vscode.window.activeTextEditor;
		if (editor) {
			const document = editor.document;
			const selection = editor.selection;

			// Get the word within the selection
			const word = document.getText(selection);

			// Save the initial selection
			const initialSelection = new vscode.Selection(selection.start, selection.end);

			// Get previous prepend text
			const previousPrependText = context.globalState.get<string>(PREPEND_TEXT_KEY, '');

			await queryOpenAI(editor, initialSelection, previousPrependText + '\n\n' + word);
		}
	});

	context.subscriptions.push(disposable, disposableShortcut);
}

async function queryOpenAI(editor: vscode.TextEditor, initialSelection: vscode.Selection, query: string) {
	// Call GPT-3 API with selected text
	const messages = [{'role': 'user', 'content': query}];
	console.log(messages)
	axios.post('https://api.openai.com/v1/chat/completions', {
		"model": "gpt-3.5-turbo-16k",
		messages
	}, {
		headers: {
			'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
		}
	}).then(response => {
		console.log(response);
		const text = response.data.choices[0].message.content;
		// Insert text on the next line after the cursor
		editor.edit(editBuilder => {
			const position = new vscode.Position(editor.selection.end.line + 1, 0);
			editBuilder.insert(position, '\n' + text);
		}).then(() => {
			// Revert the selection back to the initial selection
			editor.selection = initialSelection;
		});
	}).catch(error => {
		console.error(error);
		vscode.window.showErrorMessage(`Failed to call GPT-3: ${error.message}`);
	});
}

export function deactivate() {}
