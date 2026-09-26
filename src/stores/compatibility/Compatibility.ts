import { type VersionNum, Updates} from "./Updates";
import "./v0_2_0";

function compareSemantic(a: VersionNum, b: VersionNum): -1 | 0 | 1 {
    for (let i = 0; i < a.length; i++) {
        if (a[i] < b[i]) {
            return -1;
        }

        if (a[i] > b[i]) {
            return 1;
        }
    }

    return 0;
}

export function updateProject(data: any): void {
    const projectVersion = data["editor_version"] as string | undefined;

    if (!projectVersion) {
        console.error("Could not find key \"editor_version\" in project data");
        return;
    }

    const splitVersion = projectVersion.split('.').map(i => Number.parseInt(i)) as VersionNum;

    if (splitVersion.length < 3) {
        console.error(`Editor version not in correct format.\n\tExpected [x,x,x]\n\tGot ${splitVersion}`);
        return;
    }

    for (let i = 0; i < Updates.length; i++) {
        const updateVersion = Updates.get(i);
        const updateVersionNum = updateVersion.version;

        if (compareSemantic(splitVersion, updateVersionNum) < 0) {
            updateVersion.updateCallback(data);
        }
    }
}
