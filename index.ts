import core from '@actions/core'
import github from '@actions/github'
import { parser } from '@conventional-commits/parser'
import { Commit, PullRequestEvent, PushEvent } from '@octokit/webhooks-definitions/schema'
import { env } from 'process'

async function run() {
    core.info('🤨 Validating conventional commits')
    if (github.context.eventName === 'push') {
        validatePush(github.context.payload as PushEvent)
    }
    if (github.context.eventName == 'pull_request') {
        validatePullRequest(github.context.payload as PullRequestEvent)
    }
    core.info('🎉 Success')
}

function validatePush(event: PushEvent) {
    validateCommits(event.commits)
}

async function validatePullRequest(event: PullRequestEvent) {
    let response = await github.getOctokit(env.GITHUB_TOKEN || "").request(event.pull_request.commits_url)
    let commitResponse: { commit: Commit }[] = response.data
    let commits = commitResponse.map((response) => { return response.commit })
    validateCommits(commits)
}

function validateCommits(commits: Commit[]) {
    commits.forEach((commit) => {
        try {
            parser(commit.message)
            core.info(`✅ ${commit.message}`)
        } catch (error) {
            core.error(`❌ ${commit.message}`)
            core.setFailed(error)
        }
    })
}

run()
