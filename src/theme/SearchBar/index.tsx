import React from "react";
import { DocSearch } from "@docsearch/react";
import "@docsearch/css";
import { useThemeConfig } from "@docusaurus/theme-common";
import type { ThemeConfig } from "@docusaurus/preset-classic";

export default function SearchBar(): React.ReactNode {
  const { algolia } = useThemeConfig() as ThemeConfig;

  if (!algolia) {
    return null;
  }

  const { appId, apiKey, indexName, searchParameters, contextualSearch } =
    algolia;

  if (!appId || !apiKey || !indexName) {
    return null;
  }

  return (
    <div className="custom-docsearch">
      <DocSearch
        appId={appId}
        apiKey={apiKey}
        indexName={indexName}
        placeholder="Search posts and keywords"
        searchParameters={searchParameters}
        disableUserPersonalization={!contextualSearch}
        translations={{
          button: {
            buttonText: "Search posts",
            buttonAriaLabel: "Search posts and keywords",
          },
        }}
      />
    </div>
  );
}
