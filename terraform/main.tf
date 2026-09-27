############################################
# 레포 기본 설정 (caquick-be와 같은 정책)
############################################
data "github_repository" "this" {
  name = var.repository_name
}

resource "github_repository" "caquick_admin_fe" {
  name        = data.github_repository.this.name
  description = data.github_repository.this.description
  visibility  = data.github_repository.this.visibility

  allow_merge_commit     = true
  allow_squash_merge     = true
  allow_rebase_merge     = true
  allow_auto_merge       = true
  delete_branch_on_merge = true

  has_issues      = data.github_repository.this.has_issues
  has_projects    = data.github_repository.this.has_projects
  has_wiki        = data.github_repository.this.has_wiki
  has_discussions = data.github_repository.this.has_discussions

  lifecycle {
    prevent_destroy = true
    ignore_changes  = [description, visibility, has_issues, has_projects, has_wiki, has_discussions, topics, homepage_url]
  }
}

resource "github_repository_vulnerability_alerts" "this" {
  repository = data.github_repository.this.name
}

############################################
# Branch Ruleset: main (운영 브랜치)
############################################
resource "github_repository_ruleset" "main_protection" {
  name        = "main-protection"
  repository  = data.github_repository.this.name
  target      = "branch"
  enforcement = "active"

  conditions {
    ref_name {
      include = ["refs/heads/main"]
      exclude = []
    }
  }

  rules {
    deletion         = true
    non_fast_forward = true

    pull_request {
      required_approving_review_count   = 0
      dismiss_stale_reviews_on_push     = false
      require_code_owner_review         = false
      require_last_push_approval        = false
      required_review_thread_resolution = false
    }

    required_status_checks {
      strict_required_status_checks_policy = false

      required_check {
        context = "check"
      }
      required_check {
        context = "pr-title"
      }
      required_check {
        context = "coverage-report"
      }
      # CodeQL: 매트릭스 job 이름이 그대로 context
      required_check {
        context = "Analyze (javascript-typescript)"
      }
    }
  }
}

############################################
# Branch Ruleset: develop (통합 브랜치) — Admin은 릴리즈 후 fast-forward 동기화용으로 bypass
############################################
resource "github_repository_ruleset" "develop_protection" {
  name        = "develop-protection"
  repository  = data.github_repository.this.name
  target      = "branch"
  enforcement = "active"

  conditions {
    ref_name {
      include = ["refs/heads/develop"]
      exclude = []
    }
  }

  bypass_actors {
    actor_id    = 5 # RepositoryRole: Admin
    actor_type  = "RepositoryRole"
    bypass_mode = "always"
  }

  rules {
    deletion         = true
    non_fast_forward = true

    pull_request {
      required_approving_review_count   = 0
      dismiss_stale_reviews_on_push     = false
      require_code_owner_review         = false
      require_last_push_approval        = false
      required_review_thread_resolution = false
    }

    required_status_checks {
      strict_required_status_checks_policy = false

      required_check {
        context = "check"
      }
      required_check {
        context = "pr-title"
      }
      required_check {
        context = "coverage-report"
      }
      required_check {
        context = "Analyze (javascript-typescript)"
      }
    }
  }
}
