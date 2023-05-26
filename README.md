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

const doc = new DOMParser().parseFromString(xml);

const objectBuilder: ObjectMapperSchema<XmlData['object']> = {
	id: {mapper: rootAttrNumberValue('id'), attribute: true, required: true},
	name: {mapper: stringValue, required: true},
	value: {mapper: stringValue, required: true},
};

const itemBuilder: ArrayMapperSchema<{id: number; item: number}> = {
	id: {mapper: attrNumberValue('id'), attribute: true, required: true},
	item: {mapper: integerValue, required: true},
};

const rootBuilder: ObjectMapperSchema<XmlData> = {
	string: {mapper: stringValue, required: true},
	number: {mapper: integerValue, required: true},
	date: {mapper: dateValue, required: true},
	array: {mapper: arraySchema(itemBuilder), required: true},
	object: {mapper: objectSchema(objectBuilder), required: true},
};
const data = rootParser(doc.documentElement, rootBuilder);
```
