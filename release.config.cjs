module.exports = {
  branches: ["main"],
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    [
      "@semantic-release/changelog",
      {
        changelogFile: "cli-tool/CHANGELOG.md"
      }
    ],
    [
      "@semantic-release/npm",
      {
        pkgRoot: "cli-tool",
        npmPublish: false
      }
    ],
    [
      "@semantic-release/git",
      {
        assets: [
          "cli-tool/package.json",
          "cli-tool/package-lock.json",
          "cli-tool/CHANGELOG.md"
        ],
        message: "chore(release): ${nextRelease.version}"
      }
    ],
    [
      "@semantic-release/github",
      {
        assets: []
      }
    ]
  ]
};
