import {assertNode} from './util';
import {BaseMapperFunction} from '.';

export const stringValue: BaseMapperFunction<string> = (node) => {
	assertNode(node);
	if (node.childNodes.length !== 1) {
		// empty element
		return null;
	}
	return node.childNodes[0].nodeValue;
};

export const integerValue: BaseMapperFunction<number> = (node) => {
	assertNode(node);
	if (!node.childNodes || node.childNodes.length !== 1) {
		throw TypeError(`${node.nodeName} have none of multiple child nodes`);
	}
	const value = node.childNodes[0].nodeValue;
	return value ? parseInt(value, 10) : null;
};

export const dateValue: BaseMapperFunction<Date> = (node) => {
	assertNode(node);
	if (node.childNodes.length !== 1) {
		throw TypeError(`${node.nodeName} have none of multiple child nodes`);
	}
	return node.childNodes[0].nodeValue ? new Date(node.childNodes[0].nodeValue) : null;
};
