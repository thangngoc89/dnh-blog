import fsp from "fs-promise"
import { join } from "path"
import { condition } from "../config"
import { async as database } from "./db"
import dnh from "./api"
import { getAllPosts, getAndUpdateRawPost } from "./get"
import process from "./process"
import save from "./save"
import algolia from "./algolia"

const log = require("debug")("dnh:run")
const logStats = require("debug")("dnh:stats")

export default async function () {
  // TODO: Is it safe to do this ?
  const { db, users, posts } = await database()
  try {
    if (!posts.data.length) {
      await getAllPosts({ users, posts })
    }

    const data = posts.find(condition)
    logStats(data.length + " posts passed condition")

    await Promise.all(
      Object
      .keys(data)
      .map((key) => getAndUpdateRawPost(data[key], posts))
    )

    /**
     * Make dirs
     */
    const contentDir = join(__dirname, "../content")
    const postsDir = join(contentDir, "posts")
    await fsp.ensureDir(contentDir)
    await fsp.emptyDir(contentDir)
    await fsp.mkdirs(postsDir)
    log("Created content folder")

    await fsp.copy(join(__dirname, "../content-holder"), contentDir)
    log("Copied content from content-holder/ to content/")

    /**
     * Process data
     */
    const processedData = Object
      .keys(data)
      .map((key) => process(data[key], users))

    /**
     * Send to Algolia
     */
    await algolia(processedData)
    /**
     * Save to files
     */
    await Promise.all(
      processedData
      .map((item) => save(item, postsDir))
    )
    log("Saved posts to markdown files")

    logStats("Hit DNH API: " + dnh.hit)
  }
  catch (err) {
    log(err)
    throw err
  }

  db.save()
  db.close()
}
