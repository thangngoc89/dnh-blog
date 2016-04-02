import dnh from "./api"
import access from "safe-access"
import parseQuery from "./utils/parse-query"

const log = require("debug")("dnh:get-all-posts")

const getAllPosts = ({ users, posts }) => (
  new Promise((resolve, reject) => {
    const getAllPosts = (query = {}) => {
      dnh.getPostFromCategory("share/writes", query)
      .then((response) => JSON.parse(response.body))
      .then((json) => {
        log(query)
        users.insert(json.users)
        posts.insert(json.topic_list.topics)
        return json
      })
      .then((json) => {
        const nextPage = access(json, "topic_list.more_topics_url")
        if (nextPage) {
          const nextQuery = parseQuery(nextPage)
          getAllPosts(nextQuery)
        }
        else {
          resolve()
        }
      })
      .catch((err) => {
        reject(err)
      })
    }
    getAllPosts()
  })
)

export default getAllPosts
