import {assertNode, parseDate, parseInteger} from './util';
import {XmlMappingComposeFunction} from '.';

/**
 *  reads string text value from current rootNode and maps it to used lookupKey
 *
 * ```<root>value</root> => {lookupKey: "value"}```
 */
export const rootStringValue: XmlMappingComposeFunction<string> = ({lookupKey, rootNode}) => {
	assertNode(rootNode, rootNode, `rootStringValue key ${lookupKey} got null rootNode`);
	return rootNode.textContent;
};

/**
 * reads number value from current rootNode and maps it to used lookupKey
 *
 * ```<root>123</root> => {lookupKey: 123}```
 */
export const rootIntegerValue: XmlMappingComposeFunction<number> = (props) => {
	return parseInteger(rootStringValue(props));
};

/**
 * reads date value from current rootNode and maps it to used lookupKey
 *
 * ```<root>2021-01-01</root> => {lookupKey: Date("2021-01-01")}```
 */
export const rootDateValue: XmlMappingComposeFunction<Date> = (props) => {
	return parseDate(rootStringValue(props));
};
