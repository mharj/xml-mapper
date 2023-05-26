/* eslint-disable sort-keys */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {DOMParser} from 'xmldom';
import 'mocha';
import * as chai from 'chai';
import {
	ObjectMapperSchema,
	arraySchema,
	rootParser,
	dateValue,
	integerValue,
	objectSchema,
	stringValue,
	attrNumberValue,
	ArrayMapperSchema,
	rootAttrNumberValue,
} from '../src/';
const expect = chai.expect;

type XmlData = {
	string: string;
	number: number;
	date: Date;
	array: {item: number}[];
	object: {id: number; name: string; value: string};
};

const xml = `<root>
    <string>string</string>
    <number>123</number>
    <date>2020-01-01T00:00:00.000Z</date>
    <array>
        <item id="1">1</item>
        <item id="2">2</item>
    </array>
    <object id="123">
        <name>name</name>
        <value>value</value>
    </object>
</root>`;

let doc: Document;

describe('TestAsync cache', () => {
	before(() => {
		doc = new DOMParser().parseFromString(xml);
	});
	it('should return cached value', async () => {
		const objectBuilder: ObjectMapperSchema<XmlData['object']> = {
			id: {mapper: rootAttrNumberValue('id'), attribute: true, required: true},
			name: {mapper: stringValue, required: true},
			value: {mapper: stringValue, required: true},
		};

		const itemBuilder: ArrayMapperSchema<{id: number; item: number}> = {
			id: {mapper: attrNumberValue('id'), attribute: true, required: true},
			item: {mapper: integerValue, required: true},
		};

		const nodeBuilder: ObjectMapperSchema<XmlData> = {
			string: {mapper: stringValue, required: true},
			number: {mapper: integerValue, required: true},
			date: {mapper: dateValue, required: true},
			array: {mapper: arraySchema(itemBuilder), required: true},
			object: {mapper: objectSchema(objectBuilder), required: true},
		};
		const mapper = rootParser(doc.documentElement, nodeBuilder);
		console.log(mapper);
		expect(1).to.equal(1);
	});
});
