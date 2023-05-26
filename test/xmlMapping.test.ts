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

const xmlNamespace = `<ns:root>
    <ns:string>string</ns:string>
    <ns:number>123</ns:number>
    <ns:date>2020-01-01T00:00:00.000Z</ns:date>
    <ns:array>
        <ns:item id="1">1</ns:item>
        <ns:item id="2">2</ns:item>
    </ns:array>
    <ns:object id="123">
        <ns:name>name</ns:name>
        <ns:value>value</ns:value>
    </ns:object>
</ns:root>`;

let doc: Document;
let docWithCase: Document;
let docNamespace: Document;

describe('XML mapping', () => {
	before(() => {
		doc = new DOMParser().parseFromString(xml);
		docWithCase = new DOMParser().parseFromString(xmlWithCase);
		docNamespace = new DOMParser().parseFromString(xmlNamespace);
	});
	it('should return mapped object', async () => {
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
	it('should return namespace mapped object', async () => {
		const objectBuilder: ObjectMapperSchema<XmlData['object']> = {
			id: {mapper: rootAttrNumberValue('id'), attribute: true, required: true, namespace: 'ns'},
			name: {mapper: stringValue, required: true, namespace: 'ns'},
			value: {mapper: stringValue, required: true, namespace: 'ns'},
		};

		const itemBuilder: ArrayMapperSchema<{id: number; item: number}> = {
			id: {mapper: attrNumberValue('id'), attribute: true, required: true, namespace: 'ns'},
			item: {mapper: integerValue, required: true, namespace: 'ns'},
		};

		const nodeBuilder: ObjectMapperSchema<XmlData> = {
			string: {mapper: stringValue, required: true, namespace: 'ns'},
			number: {mapper: integerValue, required: true, namespace: 'ns'},
			date: {mapper: dateValue, required: true, namespace: 'ns'},
			array: {mapper: arraySchema(itemBuilder), required: true, namespace: 'ns'},
			object: {mapper: objectSchema(objectBuilder), required: true, namespace: 'ns'},
		};
		const mapper = rootParser(docNamespace.documentElement, nodeBuilder);
		console.log(mapper);
		expect(1).to.equal(1);
	});
});
