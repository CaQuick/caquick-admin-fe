# Terraform — GitHub 레포 설정

`CaQuick/caquick-admin-fe`의 머지 옵션과 `main`·`develop` Ruleset을 코드로 관리한다. 정책은 caquick-be와 같다.

- 필수 status check: `check` · `pr-title` · `coverage-report` · `Analyze (javascript-typescript)`
- `develop`은 Repository Admin이 bypass 가능(릴리즈 뒤 main으로 fast-forward 동기화용). `main`은 bypass 없음.

```bash
brew install terraform
export GITHUB_TOKEN=$(gh auth token)   # repo(classic) 또는 Administration: write(fine-grained)
cd terraform
terraform init
terraform import github_repository.caquick_admin_fe caquick-admin-fe   # 이미 있는 레포를 state에 연결(최초 1회)
terraform plan
terraform apply
```

state는 로컬(`*.tfstate`, gitignore). state를 잃으면 레포 import를 다시 하고, Ruleset은 `gh api repos/CaQuick/caquick-admin-fe/rulesets --jq '.[] | {id, name}'`로 id를 찾아 `terraform import github_repository_ruleset.<name> caquick-admin-fe:<id>`.
