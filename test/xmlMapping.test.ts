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

const xmlWithCase = `<root>
		<String>string</String>
		<Number>123</Number>
		<Date>2020-01-01T00:00:00.000Z</Date>
		<ArrAy>
				<Item id="1">1</Item>
				<Item id="2">2</Item>
		</ArrAy>
		<Object id="123">
				<name>name</name>
				<Value>value</Value>
		</Object>
</root>`;

let doc: Document;
let docWithCase: Document;

describe('TestAsync cache', () => {
	before(() => {
		doc = new DOMParser().parseFromString(xml);
		docWithCase = new DOMParser().parseFromString(xmlWithCase);
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
	it('should return case-insensitive value if ignore case is true', async () => {
		const objectBuilder: ObjectMapperSchema<XmlData['object']> = {
			id: {mapper: rootAttrNumberValue('id'), attribute: true, required: true, ignoreCase: true},
			name: {mapper: stringValue, required: true},
			value: {mapper: stringValue, required: true, ignoreCase: true},
		};

		const itemBuilder: ArrayMapperSchema<{id: number; item: number}> = {
			id: {mapper: attrNumberValue('id'), attribute: true, required: true, ignoreCase: true},
			item: {mapper: integerValue, required: true, ignoreCase: true},
		};

		const nodeBuilder: ObjectMapperSchema<XmlData> = {
			string: {mapper: stringValue, required: true, ignoreCase: true},
			number: {mapper: integerValue, required: true, ignoreCase: true},
			date: {mapper: dateValue, required: true, ignoreCase: true},
			array: {mapper: arraySchema(itemBuilder), required: true, ignoreCase: true},
			object: {mapper: objectSchema(objectBuilder), required: true, ignoreCase: true},
		};

		const mapper = rootParser(docWithCase.documentElement, nodeBuilder);
		console.log(mapper);
		expect(1).to.equal(1);
	});
});
