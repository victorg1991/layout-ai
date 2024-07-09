import {readFileSync} from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';
import {
	getBannerDefinition,
	getFragmentDefinition,
	getPageBody,
	getRowDefinition
} from './utils.mjs';

const URL =
	'https://us-central1-aiplatform.googleapis.com/v1/projects/liferaycloud-development/locations/us-central1/publishers/google/models/gemini-1.5-pro-001:generateContent';

const TOKEN = '<token>';

async function main() {
	const base64 = readFileSync(
		path.join(fileURLToPath(import.meta.url), '..', 'image2.png'),
		{
			encoding: 'base64'
		}
	);

	const instructions = readFileSync(
		path.join(
			fileURLToPath(import.meta.url),
			'..',
			'systemInstructions.txt'
		),
		{
			encoding: 'utf-8'
		}
	);

	const response = await fetch(URL, {
		headers: {
			Authorization: `Bearer ${TOKEN}`,
			'Content-Type': 'application/json; charset=utf-8'
		},

		body: JSON.stringify(getBody(base64, instructions)),
		method: 'POST'
	});

	const json = await response.json();

	const definition = JSON.parse(json.candidates[0].content.parts[0].text);

	console.log(definition);

	const pageElements = [];

	for (const component of definition) {
		if (component.name) {
			const pageElement = getPageElement(component.name);

			if (pageElement) {
				pageElements.push(pageElement);
			}
		} else {
			const innerPageElements = [];

			for (const innerComponent of component.components) {
				const pageElement = getPageElement(innerComponent.name);

				if (pageElement) {
					innerPageElements.push(pageElement);
				}
			}

			pageElements.push(getRowDefinition(innerPageElements));
		}
	}

	await createSitePage(pageElements);
}

function getPageElement(name) {
	switch (name) {
		case 'button': {
			return getFragmentDefinition('BASIC_COMPONENT-button');
		}

		case 'header': {
			return getFragmentDefinition('NAVIGATION_BARS-header-light');
		}

		case 'heading': {
			return getFragmentDefinition('BASIC_COMPONENT-heading');
		}

		case 'hero banner': {
			return getBannerDefinition();
		}

		case 'image': {
			return getFragmentDefinition('BASIC_COMPONENT-image');
		}

		case 'carousel': {
			return getFragmentDefinition('BASIC_COMPONENT-slider');
		}

		case 'card': {
			return getFragmentDefinition('BASIC_COMPONENT-card');
		}
		case 'video': {
			return getFragmentDefinition('BASIC_COMPONENT-external-video');
		}

		case 'social': {
			return getFragmentDefinition('BASIC_COMPONENT-social');
		}

		case 'paragraph': {
			return getFragmentDefinition('BASIC_COMPONENT-paragraph');
		}

		case 'paragraph': {
			return getFragmentDefinition('BASIC_COMPONENT-social');
		}

		case 'footer': {
			return getFragmentDefinition('FOOTERS-footer-nav-light');
		}

		default:
			return null;
	}
}

main();

async function createSitePage(pageElements) {
	const response1 = fetch(
		'http://localhost:8080/o/headless-delivery/v1.0/sites/guest/site-pages/',
		{
			headers: {
				Authorization: `Basic ${btoa('test@liferay.com:test')}`,
				'Content-Type': 'application/json'
			},
			method: 'POST',
			body: JSON.stringify(getPageBody(pageElements))
		}
	)
		.then((response) => response.json())
		.then(console.log);
}

function getBody(base64Image, systemInstruction) {
	return {
		contents: [
			{
				role: 'user',
				parts: [
					{
						text: 'Can you describe the layout of the specifiying all the web components used and the position of them'
					},
					{
						inline_data: {
							data: base64Image,
							mime_type: 'image/png'
						}
					}
				]
			}
		],

		systemInstruction: {
			role: '',
			parts: [
				{
					text: systemInstruction
				}
			]
		},
		generationConfig: {
			response_mime_type: 'application/json',
			temperature: 0
		}
	};
}
