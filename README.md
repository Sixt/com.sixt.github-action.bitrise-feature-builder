# Trigger feature builds on Bitrise

This GitHub action allows to trigger feature builds on Bitrise by commenting on a PR.

## Publish to a distribution branch

Actions are run from GitHub repos.  We will create a releases branch and only checkin production modules (core in this case). 

Comment out node_modules in .gitignore and create a releases/v1 branch
```bash
# comment out in distribution branches
# node_modules/
```

```bash
$ npm prune --production
$ git add node_modules
$ git commit -a -m "prod dependencies"
$ git push origin releases/v1
```

Your action is now published! :rocket: 

See the [versioning documentation](https://github.com/actions/toolkit/blob/master/docs/action-versioning.md)

## Validate

You can now validate the action by referencing the releases/v1 branch

```yaml
uses: sixt/com.sixt.github-action.bitrise-feature-builder@releases/v1
with:
  github-token: ${{ secrets.GITHUB_TOKEN }}
  bitrise-token: ${{ secrets.BITRISE_TOKEN }}
  bitrise-slug: <app_slug>
```

## Usage:

After testing you can [create a v1 tag](https://github.com/actions/toolkit/blob/master/docs/action-versioning.md) to reference the stable and tested action

```yaml
uses: sixt/com.sixt.github-action.bitrise-feature-builder@v1
```
