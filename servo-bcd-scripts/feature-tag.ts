import { features } from 'web-features';
import { writeFileSync, readFileSync } from 'fs';
import fetch from 'node-fetch';

interface ServoBcdRaw {
  __version: string;
  extensions: Array<any>;
  results: {
    'http://localhost:5200/tests/': Array<{
      exposure: string;
      name: string;
      result: boolean;
    }>;
  };
  userAgent: string;
}

interface ServoBcd {
  [name: string]: {
    [exposure: string]: boolean;
  };
}

interface PopularityRaw {
  bucket_id: number;
  date: string;
  day_percentage: number;
  property_name: string;
}

const main = async (bcdInputFilePath: string) => {
  const servoBcdRaw: ServoBcdRaw = JSON.parse(
    readFileSync(bcdInputFilePath, 'utf-8')
  );
  const bcdList = servoBcdRaw.results['http://localhost:5200/tests/'];
  const servoBcd: ServoBcd = {};

  for (const { exposure, name, result } of bcdList) {
    if (!servoBcd[name]) {
      servoBcd[name] = {};
    }
    servoBcd[name][exposure] = result;
  }

  /* Mapping feature to BCD keys, for example:
   * {
   *       "webauthn": [
   *           "api.AuthenticatorAssertionResponse" : {
   *              "Window": true,
   *              "Worker": false,
   *              "ServiceWorker": false,
   *              "SharedWorker": false
   *           },
   *           ...
   *       ],
   *       ...
   *   }
   */
  const featureToBcd = new Map<
    string,
    Array<{ [key: string]: { [exposure: string]: boolean } | {} }>
  >();

  for (const [feature, { compat_features }] of Object.entries(features)) {
    if (!compat_features) {
      continue;
    }

    const servo_compat_features: Array<{
      [key: string]: { [exposure: string]: boolean } | {};
    }> = [];
    for (const key of compat_features) {
      servo_compat_features.push({ [key]: servoBcd[key] || {} });
    }
    featureToBcd.set(feature, servo_compat_features);
  }

  const popularityRaw: PopularityRaw[] = await fetch(
    'https://chromestatus.com/data/webfeaturepopularity'
  ).then((res: any) => res.json());

  function toKebabCase(str: string): string {
    return str
      .replace(/(canvas2d)/gi, 'canvas-2d') // Special case for canvas2d
      .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
      .toLowerCase();
  }

  const popularityBcdMap: Map<
    string,
    { day_percentage: number; bcd_entries: ServoBcd[] } | null
  > = new Map();

  for (const { property_name, day_percentage } of popularityRaw) {
    const kebabCaseName = toKebabCase(property_name);
    if (featureToBcd.has(kebabCaseName)) {
      const bcdEntries = featureToBcd.get(kebabCaseName);
      if (bcdEntries) {
        popularityBcdMap.set(kebabCaseName, {
          day_percentage,
          bcd_entries: bcdEntries,
        });
      }
    } else {
      popularityBcdMap.set(kebabCaseName, null);
    }
  }

  const featureObj = Object.fromEntries(popularityBcdMap);
  writeFileSync('popularityBcdMap.json', JSON.stringify(featureObj, null, 2));
};

const bcdInputFilePath = process.argv[2];

if (bcdInputFilePath === void 0) {
  console.error('Please provide the path to the BCD input file via the bcd_input environment variable.');
  process.exit(1);
}

main(bcdInputFilePath);
