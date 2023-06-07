/* eslint-disable sort-imports */
/* eslint-disable sort-keys */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {DOMParser} from 'xmldom';
import 'mocha';
import * as chai from 'chai';
import {
	arraySchemaValue,
	dateValue,
	integerValue,
	XmlMappingSchema,
	objectSchemaValue,
	rootAttrNumberValue,
	rootIntegerValue,
	rootParser,
	setLogger,
	stringValue,
	XmlParserError,
	directArraySchemaValue,
} from '../src/';
const expect = chai.expect;

type XmlData = {
	root: {
		string: string;
		number: number;
		date: Date;
		array: {id: number; item: number}[];
		object: {id: number; name: string; value: string};
	};
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

const xmlWithObjectArray = `<root>
		<array>
				<item>
						<id>1</id>	
				</item>
				<item>
						<id>2</id>
				</item>
		</array>
</root>`;

const xmlEmptyString = `<root>
		<string></string>
</root>`;

let doc: Document;
let docWithCase: Document;
let docNamespace: Document;
let docWithObjectArray: Document;
let docEmptyString: Document;

const output = {
	root: {
		string: 'string',
		number: 123,
		date: new Date('2020-01-01T00:00:00.000Z'),
		array: [
			{id: 1, item: 1},
			{id: 2, item: 2},
		],
		object: {id: 123, name: 'name', value: 'value'},
	},
};

describe('XML mapping', () => {
	before(() => {
		setLogger(undefined);
		doc = new DOMParser().parseFromString(xml);
		docWithCase = new DOMParser().parseFromString(xmlWithCase);
		docNamespace = new DOMParser().parseFromString(xmlNamespace);
		docWithObjectArray = new DOMParser().parseFromString(xmlWithObjectArray);
		docEmptyString = new DOMParser().parseFromString(xmlEmptyString);
	});
	it('should return mapped object', async () => {
		const objectSchema: XmlMappingSchema<XmlData['root']['object']> = {
			id: {mapper: rootAttrNumberValue('id'), required: true},
			name: {mapper: stringValue, required: true},
			value: {mapper: stringValue, required: true},
		};

		const itemSchema: XmlMappingSchema<XmlData['root']['array'][number]> = {
			id: {mapper: rootAttrNumberValue('id'), required: true},
			item: {mapper: rootIntegerValue, required: true},
		};

		const dataSchema: XmlMappingSchema<XmlData['root']> = {
			string: {mapper: stringValue, required: true},
			number: {mapper: integerValue, required: true},
			date: {mapper: dateValue, required: true},
			array: {mapper: arraySchemaValue(itemSchema), required: true},
			object: {mapper: objectSchemaValue(objectSchema), required: true},
		};

		const rootSchema: XmlMappingSchema<XmlData> = {
			root: {mapper: objectSchemaValue(dataSchema), required: true},
		};

		const data: XmlData = rootParser(doc.documentElement, rootSchema);
		expect(data).to.be.eql(output);
	});
	it('should return case-insensitive value if ignore case is true and automap attr keys', async () => {
		const objectSchema: XmlMappingSchema<XmlData['root']['object']> = {
			id: {mapper: rootAttrNumberValue(), required: true},
			name: {mapper: stringValue, required: true},
			value: {mapper: stringValue, required: true},
		};

		const itemSchema: XmlMappingSchema<{id: number; item: number}> = {
			id: {mapper: rootAttrNumberValue(), required: true},
			item: {mapper: rootIntegerValue, required: true},
		};

		const dataSchema: XmlMappingSchema<XmlData['root']> = {
			string: {mapper: stringValue, required: true},
			number: {mapper: integerValue, required: true},
			date: {mapper: dateValue, required: true},
			array: {mapper: arraySchemaValue(itemSchema), required: true},
			object: {mapper: objectSchemaValue(objectSchema), required: true},
		};

		const rootSchema: XmlMappingSchema<XmlData> = {
			root: {mapper: objectSchemaValue(dataSchema), required: true},
		};

		const data: XmlData = rootParser(docWithCase.documentElement, rootSchema, {ignoreCase: true});
		expect(data).to.be.eql(output);
	});
	it('should return namespace mapped object', async () => {
		const objectSchema: XmlMappingSchema<XmlData['root']['object']> = {
			id: {mapper: rootAttrNumberValue('id'), required: true, namespace: 'ns'},
			name: {mapper: stringValue, required: true, namespace: 'ns'},
			value: {mapper: stringValue, required: true, namespace: 'ns'},
		};

		const itemSchema: XmlMappingSchema<{id: number; item: number}> = {
			id: {mapper: rootAttrNumberValue('id'), required: true, namespace: 'ns'},
			item: {mapper: rootIntegerValue, required: true, namespace: 'ns'},
		};

		const dataSchema: XmlMappingSchema<XmlData['root']> = {
			string: {mapper: stringValue, required: true, namespace: 'ns'},
			number: {mapper: integerValue, required: true, namespace: 'ns'},
			date: {mapper: dateValue, required: true, namespace: 'ns'},
			array: {mapper: arraySchemaValue(itemSchema), required: true, namespace: 'ns'},
			object: {mapper: objectSchemaValue(objectSchema), required: true, namespace: 'ns'},
		};

		const rootSchema: XmlMappingSchema<XmlData> = {
			root: {mapper: objectSchemaValue(dataSchema), required: true, namespace: 'ns'},
		};

		const data: XmlData = rootParser(docNamespace.documentElement, rootSchema);
		expect(data).to.be.eql(output);
	});
	it('should return error if key is not found', async () => {
		const objectSchema: XmlMappingSchema<XmlData['root']['object']> = {
			id: {mapper: rootAttrNumberValue('id'), required: true},
			name: {mapper: stringValue, required: true},
			value: {mapper: stringValue, required: true},
		};

		const itemSchema: XmlMappingSchema<{id: number; item: number}> = {
			id: {mapper: rootAttrNumberValue('id'), required: true},
			item: {mapper: rootIntegerValue, required: true},
		};

		const dataSchema: XmlMappingSchema<XmlData['root'] & {notExists: string}> = {
			string: {mapper: stringValue, required: true},
			number: {mapper: integerValue, required: true},
			date: {mapper: dateValue, required: true},
			array: {mapper: arraySchemaValue(itemSchema), required: true},
			object: {mapper: objectSchemaValue(objectSchema), required: true},
			notExists: {mapper: stringValue, required: true},
		};
		const rootSchema: XmlMappingSchema<XmlData> = {
			root: {mapper: objectSchemaValue(dataSchema), required: true},
		};
		expect(() => rootParser(doc.documentElement, rootSchema)).to.throw(XmlParserError, `stringValue got null node from #document/root key: notExists`);
	});
	it('should return error if extra key found', async () => {
		const objectSchema: XmlMappingSchema<XmlData['root']['object']> = {
			id: {mapper: rootAttrNumberValue('id'), required: true},
			name: {mapper: stringValue, required: true},
			value: {mapper: stringValue, required: true},
		};

		const itemSchema: XmlMappingSchema<{id: number; item: number}> = {
			id: {mapper: rootAttrNumberValue('id'), required: true},
			item: {mapper: rootIntegerValue, required: true},
		};
		type BrokenRoot = Omit<XmlData['root'], 'string'>;
		const dataSchema: XmlMappingSchema<BrokenRoot> = {
			number: {mapper: integerValue, required: true},
			date: {mapper: dateValue, required: true},
			array: {mapper: arraySchemaValue(itemSchema), required: true},
			object: {mapper: objectSchemaValue(objectSchema), required: true},
		};
		const rootSchema: XmlMappingSchema<XmlData> = {
			root: {mapper: objectSchemaValue<any>(dataSchema), required: true},
		};
		expect(() => rootParser(doc.documentElement, rootSchema, {isStrict: true})).to.throws(XmlParserError, `unknown key(s) 'string' in #document/root`);
	});
	it('should parse item with array of object', async () => {
		const itemSchema: XmlMappingSchema<{id: string}> = {
			id: {mapper: stringValue, required: true},
		};
		const dataSchema: XmlMappingSchema<{
			items: {id: string}[];
		}> = {
			items: {mapper: directArraySchemaValue('array', itemSchema), required: true},
		};

		const parsed = rootParser(docWithObjectArray.documentElement, dataSchema);

		expect(parsed).to.be.eql({
			items: [{id: '1'}, {id: '2'}],
		});
	});
	it('should return empty string if node is empty and emptyAsNull is false', async () => {
		const dataSchema: XmlMappingSchema<{
			string: string;
		}> = {
			string: {mapper: stringValue, emptyAsNull: false},
		};

		const parsed = rootParser(docEmptyString.documentElement, dataSchema);

		expect(parsed).to.be.eql({
			string: '',
		});
	});
});
