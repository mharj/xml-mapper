# Schema-based XML Parsing Utility Library

This is a library for parsing XML files based on a provided mapping schema. It is written in TypeScript and can be installed via npm.

## Installation

To install the library, run the following command:

```bash
npm install --save @avanio/xml-mapper
```

## Usage

```typescript
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

const doc = new DOMParser().parseFromString(xml);

const objectSchema: MappingSchema<XmlData['root']['object']> = {
	id: {mapper: rootAttrNumberValue('id'), required: true},
	name: {mapper: stringValue, required: true},
	value: {mapper: stringValue, required: true},
};

const itemSchema: MappingSchema<XmlData['root']['array'][number]> = {
	id: {mapper: rootAttrNumberValue('id'), required: true},
	item: {mapper: rootIntegerValue, required: true},
};

const dataSchema: MappingSchema<XmlData['root']> = {
	string: {mapper: stringValue, required: true},
	number: {mapper: integerValue, required: true},
	date: {mapper: dateValue, required: true},
	array: {mapper: arraySchemaValue(itemSchema), required: true},
	object: {mapper: objectSchemaValue(objectSchema), required: true},
};

const rootSchema: MappingSchema<XmlData> = {
	root: {mapper: objectSchemaValue(dataSchema), required: true},
};

const data: XmlData = rootParser(doc.documentElement, rootSchema);
```
