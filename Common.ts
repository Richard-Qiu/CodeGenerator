class CodeEnum {
    public name: string = "";
}

class CodeClass {
    public name: string = "";
    public properties: Array<CodeProperty> = [];
}

class CodeProperty {
    public type: string = "";
    public typeWithoutList: string = "";
    public name: string = "";
    public isList: boolean = false;
    public listItemType: string = "";
}

class CodeUrlPart {
}

class CodeUrlParameter extends CodeUrlPart {
    public type: string = "";
    public name: string = "";
}

class CodeUrlPlain extends CodeUrlPart {
    public plainUrl: string = "";
}

class CodeInvokeItem {
    public name: string = "";
    public urlPath: Array<CodeUrlPart> = [];
    public urlQueryString: Array<CodeUrlPart> = [];
    public method: string = "GET";
    public needAccessToken: boolean = false;
    public requestBody: Array<CodeProperty> = [];
    public responseBody: Array<CodeProperty> = [];
}

class PseudoCode {
    public codeClass: CodeClass = new CodeClass();
    public codeInvokeItem: CodeInvokeItem = new CodeInvokeItem();
    public enums: Array<CodeEnum> = [];
}

interface IBuildCode {
    buildCode(pseudoCode: PseudoCode): string;
}

function camelNaming(name: string) {
    var nameLower = name.toLowerCase();
    if (name.length <= 1) {
        return nameLower;
    }
    else {
        return nameLower.substr(0, 1) + name.substr(1);
    }
}

function padRight(propertyType: string, Length: number, padSymbol: string): string {
    if (propertyType.length < Length) {
        let differNumber = Length - propertyType.length;
        for (var i = 0; i < differNumber; i++) {
            propertyType += padSymbol;
        }
    }
    return propertyType;
}

function parseCode(pseudoCodeString: string): PseudoCode {
    pseudoCodeString = pseudoCodeString.replaceAll("\r", "");
    let lines = pseudoCodeString.split("\n");

    let pseudoCode = new PseudoCode();
    let codeClass = pseudoCode.codeClass;
    let codeInvokeItem = pseudoCode.codeInvokeItem;
    let enums = pseudoCode.enums;

    const StageLookupClassOrInvokeItemName = 0;
    const StageLookupClassBlock = 1;
    const StageLookupClassProperties = 2;
    const StageLookupInvokeItemBlock = 11;
    const StageLookupInvokeItemProperties = 12;
    const StageLookupInvokeItemRequestBodyProperties = 13;
    const StageLookupInvokeItemResponseBodyProperties = 14;
    const StageCompleted = 99;

    let stage = StageLookupClassOrInvokeItemName;

    // Find the class name line which starts with "class"
    lines.forEach((line) => {
        var commentsIndex = line.indexOf('//');
        if (commentsIndex > 0) {
            line = line.substr(0, commentsIndex);
        }

        line = line.trim();
        switch (stage) {
            case StageLookupClassOrInvokeItemName:
                if (line.startsWith("enum ")) {
                    var enumName = line.substr(4).trimEnd(";").trim();
                    var codeEnum = new CodeEnum();
                    codeEnum.name = enumName;
                    enums.push(codeEnum);
                }
                else if (line.startsWith("class ")) {
                    if (String.isNullOrEmpty(codeClass.name)) {
                        codeClass.name = line.substr(5).trim();
                        stage = StageLookupClassBlock;
                    }
                }
                else if (line.startsWith("invokeitem ")) {
                    if (String.isNullOrEmpty(codeInvokeItem.name)) {
                        codeInvokeItem.name = line.substr(10).trim();
                        stage = StageLookupInvokeItemBlock;
                    }
                }
                break;

            case StageLookupClassBlock:
                if (line.startsWith("{")) {
                    stage = StageLookupClassProperties;
                }
                break;

            case StageLookupClassProperties:
                if (line.startsWith("}")) {
                    stage = StageCompleted;
                }
                else {
                    line = line.trimEnd(";");
                    var pairs = line.split(" ");
                    var property = new CodeProperty();
                    pairs.forEach((p) => {
                        if (!String.isNullOrEmpty(p)) {
                            if (String.isNullOrEmpty(property.type)) {
                                property.type = p;
                                if (p.toLowerCase().startsWith("list<")) {
                                    property.isList = true;
                                    property.listItemType = p.substr(4).trimStart("<").trimEnd(">");
                                }
                                property.typeWithoutList = property.isList ? property.listItemType : property.type;
                            }
                            else if (String.isNullOrEmpty(property.name)) {
                                property.name = p;
                                codeClass.properties.push(property);
                            }
                        }
                    });
                }
                break;

            case StageLookupInvokeItemBlock:
                if (line.startsWith("{")) {
                    stage = StageLookupInvokeItemProperties;
                }
                break;

            case StageLookupInvokeItemProperties:
                if (line.startsWith("}")) {
                    stage = StageCompleted;
                }
                else {
                    line = line.trimEnd(";");
                    let assignmentIndex = line.indexOf("=");
                    let colonIndex = line.indexOf(":");
                    // get the min of positive numbers
                    assignmentIndex = (assignmentIndex < 0) ? 999 : assignmentIndex;
                    colonIndex = (colonIndex < 0) ? 999 : colonIndex;
                    let splitterIndex = Math.min(assignmentIndex, colonIndex);
                    if (splitterIndex != 999) {
                        let pairs: string[] = [];
                        if (splitterIndex < (line.length - 1)) {
                            pairs.push(line.substr(0, splitterIndex));
                            pairs.push(line.substr(splitterIndex + 1));
                        }
                        else {
                            pairs.push(line);
                        }
                        if (pairs.length === 2) {
                            let propertyName = pairs[0].trim().toLowerCase();
                            let propertyValue = pairs[1].trim();
                            switch (propertyName) {
                                case "method":
                                    codeInvokeItem.method = propertyValue.trim('"');
                                    break;

                                case "url":
                                    let url = propertyValue.trim('"');
                                    let urlPairs = url.split("?");
                                    if (urlPairs.length === 2) {
                                        let urlPath = urlPairs[0];
                                        let urlQueryString = urlPairs[1];
                                        codeInvokeItem.urlPath = parseUrlParts(urlPath);
                                        codeInvokeItem.urlQueryString = parseUrlParts(urlQueryString);
                                    }
                                    break;

                                case "requestbody":
                                    stage = StageLookupInvokeItemRequestBodyProperties;
                                    break;

                                case "responsebody":
                                    stage = StageLookupInvokeItemResponseBodyProperties;
                                    break;

                                case "needaccesstoken":
                                    codeInvokeItem.needAccessToken = (propertyValue.toLowerCase() === "true");
                                    break;
                            }
                        }
                    }
                }
                break;

            case StageLookupInvokeItemRequestBodyProperties:
                if (line.startsWith("}")) {
                    stage = StageLookupInvokeItemProperties;
                }
                else {
                    line = line.trimEnd(";");
                    var pairs = line.split(":");
                    var property = new CodeProperty();
                    pairs.forEach((p) => {
                        p = p.trim();
                        if (!String.isNullOrEmpty(p)) {
                            if (String.isNullOrEmpty(property.name)) {
                                property.name = p;
                                codeInvokeItem.requestBody.push(property);
                            }
                            else if (String.isNullOrEmpty(property.type)) {
                                property.type = p;
                                if (p.toLowerCase().startsWith("list<")) {
                                    property.isList = true;
                                    property.listItemType = p.substr(4).trimStart("<").trimEnd(">");
                                }
                                property.typeWithoutList = property.isList ? property.listItemType : property.type;
                            }
                        }
                    });
                }
                break;

            case StageLookupInvokeItemResponseBodyProperties:
                if (line.startsWith("}")) {
                    stage = StageLookupInvokeItemProperties;
                }
                else {
                    line = line.trimEnd(";");
                    var pairs = line.split(":");
                    var property = new CodeProperty();
                    pairs.forEach((p) => {
                        p = p.trim();
                        if (!String.isNullOrEmpty(p)) {
                            if (String.isNullOrEmpty(property.name)) {
                                property.name = p;
                                codeInvokeItem.responseBody.push(property);
                            }
                            else if (String.isNullOrEmpty(property.type)) {
                                property.type = p;
                                if (p.toLowerCase().startsWith("list<")) {
                                    property.isList = true;
                                    property.listItemType = p.substr(4).trimStart("<").trimEnd(">");
                                }
                                property.typeWithoutList = property.isList ? property.listItemType : property.type;
                            }
                        }
                    });
                }
                break;

            case StageCompleted:
                break;

            default:
                break;
        }
    });

    return pseudoCode;
}

function parseUrlParts(url: string): Array<CodeUrlPart> {
    let parts: Array<CodeUrlPart> = [];

    let left = url;
    while (true) {
        let start = left.indexOf("{");
        if (start < 0) {
            break;
        }

        let end = left.indexOf("}", start);
        if (end <= 0) {
            break;
        }

        let plainPart = new CodeUrlPlain();
        plainPart.plainUrl = left.substr(0, start);
        parts.push(plainPart);

        let parameterString = left.substr(start + 1, end - start - 1);
        let parameterPairs = parameterString.split(":");
        if (parameterPairs.length == 2) {
            let parameterPart = new CodeUrlParameter();
            parameterPart.name = parameterPairs[0].trim();
            parameterPart.type = parameterPairs[1].trim();
            parts.push(parameterPart);
        }

        left = left.substr(end + 1);
    }

    if (!String.isNullOrEmpty(left)) {
        let lastPart = new CodeUrlPlain();
        lastPart.plainUrl = left;
        parts.push(lastPart);
    }

    return parts;
}

declare var hljs;

function generateCode(codeString: string, language: string): void {
    var finalCode = "";
    var build: IBuildCode;
    var preview = $("#preview");
    var pseudoCode = parseCode(codeString);

    switch (language) {
        case "C#":
            build = new CodeCSharp();
            preview.removeClass("objectivec").removeClass("java").removeClass("typescript").addClass("cs");
            break;
        case "Objective-C":
            build = new CodeObjectiveC();
            preview.removeClass("java").removeClass("cs").removeClass("typescript").addClass("objectivec");
            break;
        case "Java":
            build = new CodeJava();
            preview.removeClass("objectivec").removeClass("cs").removeClass("typescript").addClass("java");
            break;
        case "TypeScript":
            build = new CodeTypeScript();
            preview.removeClass("objectivec").removeClass("cs").removeClass("java").addClass("typescript");
            break;
        default:
            alert("Error Type");
            break;
    }

    finalCode = build.buildCode(pseudoCode);

    $("#GeneratedCode").val(finalCode);
    $("#CopyButton").attr("data-clipboard-text", finalCode);

    finalCode = finalCode.replaceAll("&", "&amp;");
    finalCode = finalCode.replaceAll(" ", "&nbsp;");
    finalCode = finalCode.replaceAll("<", "&lt;");
    finalCode = finalCode.replaceAll(">", "&gt;");
    finalCode = finalCode.replaceAll("\r\n", "<br>");

    preview.html(finalCode);

    $('pre code').each(function (i, block) {
        hljs.highlightBlock(block);
    });
}

function UpdateToEntitySample() {
    var sample: string =
        "enum Importance;\r\n"
        + "enum Status;\r\n"
        + "class Person\r\n"
        + "{\r\n"
        + "    Guid Id;\r\n"
        + "    string Name;\r\n"
        + "    Importance Importance;\r\n"
        + "    Status Status;\r\n"
        + "    DateTime Birthday;\r\n"
        + "    TimeSpan Timestamp;\r\n"
        + "    List <Person> Parents;\r\n"
        + "}";

    $("#CodeEditor").val(sample);
}

function UpdateToInvokeItemSample() {
    var sample: string =
        "enum Importance;\r\n"
        + "enum Status;\r\n"
        + "invokeitem CreatePerson\r\n"
        + "{\r\n"
        + "    Method = \"POST\";\r\n"
        + "    Url = \"Corporations/{corporationId: Guid}/Create?ownerId={userId: Guid}\";\r\n"
        + "    RequestBody: {\r\n"
        + "        User: Person;\r\n"
        + "        UserImportance: Importance;\r\n"
        + "    };\r\n"
        + "    ResponseBody: {\r\n"
        + "        Person: Person;\r\n"
        + "        UserStatus: Status;\r\n"
        + "    };\r\n"
        + "}";

    $("#CodeEditor").val(sample);
}

$(document).ready(() => {
    var previous = "";
    var previousLanguage = "";

    $("#SampleEntityButton").on("click", function () {
        if (confirm("Refresh to Entity sample code?")) {
            UpdateToEntitySample();
        }
    });
    $("#SampleInvokeItemButton").on("click", function () {
        if (confirm("Refresh to InvokeItem sample code?")) {
            UpdateToInvokeItemSample();
        }
    });
    UpdateToEntitySample();

    window.setInterval(function () {
        var currentLanguage = $("#language").children('option:selected').val();
        var current = $("#CodeEditor").val();
        if (current !== previous || previousLanguage !== currentLanguage) {
            previous = current;
            previousLanguage = currentLanguage;

            generateCode(current, currentLanguage);
        }
    }, 2000);
});


