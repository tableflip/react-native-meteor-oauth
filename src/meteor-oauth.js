import React from 'react'
import { ActivityIndicator, Text, TouchableOpacity, View, Modal, WebView } from 'react-native'
import cheerio from 'cheerio'
import qs from 'qs'
import randomize from 'randomatic'
import Base64 from 'base-64'
import Meteor, { createContainer } from 'react-native-meteor'

import providerConfigs from '../provider-configs'

const styles = {
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-around' },
  button: { flex: -1 },
  buttonLogin: { backgroundColor: '#bbb'},
  buttonLogout: { backgroundColor: '#bbb'},
  buttonLoginText: { textAlign: 'center', paddingVertical: 12, paddingHorizontal: 40 },
  buttonLogoutText: { textAlign: 'center', paddingVertical: 12, paddingHorizontal: 40 },
  text: { textAlign: 'center', marginBottom: 15 },
  view: { flex: 1, alignSelf: 'stretch', justifyContent: 'center' }
}

class Login extends React.Component {
  static propTypes = {
    provider: React.PropTypes.string.isRequired,
    callbackUrl: React.PropTypes.string.isRequired,
    meteorServerDomain: React.PropTypes.string.isRequired,
    meteorServerProtocol: React.PropTypes.string.isRequired,
    clientId: React.PropTypes.string.isRequired,
    scope: React.PropTypes.string,
    url: React.PropTypes.string,
    extraRequestParams: React.PropTypes.string,
    styles: React.PropTypes.object
  }

  static defaultProps = {
    styles: {},
    classNames: {}
  }

  state = {
    stage: 'initial',
    targetUrl: ''
  }
  
  constructor (props) {
    super(props)

    this.providerConfig = providerConfigs[this.props.provider] || {}

    const propStyles = this.props.styles || {}

    this.styles = {
      buttonContainer: Object.assign({}, styles.buttonContainer, propStyles.buttonContainer),
      buttonLogin: Object.assign({}, styles.button, styles.buttonLogin, this.providerConfig.styles.buttonLogin, propStyles.buttonLogin),
      buttonLogout: Object.assign({}, styles.button, styles.buttonLogout, this.providerConfig.styles.buttonLogout, propStyles.buttonLogout),
      buttonLoginText: Object.assign({}, styles.buttonLoginText, this.providerConfig.styles.buttonLoginText, propStyles.buttonLoginText),
      buttonLogoutText: Object.assign({}, styles.buttonLogoutText, this.providerConfig.styles.buttonLogoutText, propStyles.buttonLogoutText),
      text: Object.assign({}, styles.text, propStyles.text),
      view: Object.assign({}, styles.view, propStyles.view),  
    }
  }


  login = () => {
    const url = this.props.url || this.providerConfig.url
    const randomToken = randomize('*', 10)
    const state = stateParam('popup', randomToken, this.props.callbackUrl)

    const queryString = qs.stringify(Object.assign({
      client_id: this.props.clientId,
      redirect_uri: this.props.callbackUrl,
      scope: this.props.scope || this.providerConfig.scope,
      state
    }, this.providerConfig.extraRequestParams, this.props.extraRequestParams))

    this.setState({
      targetUrl: `${url}?${queryString}`,
      stage: 'webView'
    })
  }

  navigation = ({ url }) => {
    const regex = new RegExp(`^${this.props.callbackUrl}\[\?#](.*)$`)
    
    const parsedUrl = regex.exec(url)
    if (parsedUrl) {
      this.setState({ targetUrl : null })
      setTimeout(() => {
        this.setState({ stage: 'confirmation' })
        const meteorUri = `${this.props.meteorServerProtocol}://${this.props.meteorServerDomain}/_oauth/${this.props.provider.toLowerCase()}?${parsedUrl[1]}`
        fetch(meteorUri)
          .then((res) => res.text())
          .then((text) => {
            let $ = cheerio.load(text)
            const config = JSON.parse($('#config').text())
            Meteor._login({ oauth: {
              credentialToken: config.credentialToken,
              credentialSecret: config.credentialSecret
            }}, (err, res) => {
              if (err) console.error('Error', err)
              this.setState({ stage: 'initial' })
            })
          })
          .catch((err) => {
            console.error('Error', err)
            this.setState({ stage: 'initial' })
          })
      }, 500)
    }
  }

  renderStage = (stage, user) => {
    if (user) {
      return (<View style={this.styles.view}>
        <Text style={this.styles.text}>Logged in as {user.profile.name}.</Text>
        <View style={this.styles.buttonContainer}>
          <TouchableOpacity onPress={() => Meteor.logout()} style={this.styles.buttonLogout}>
            <Text style={this.styles.buttonLogoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>)
    }

    return {
      initial: (
        <View style={this.styles.buttonContainer}>
          <TouchableOpacity onPress={this.login} style={this.styles.buttonLogin}>
            <Text style={this.styles.buttonLoginText}>Login with {this.props.provider}</Text>
          </TouchableOpacity>
        </View>),

      webView: (
        <Modal
          animationType='fade'
          onRequestClose={() => this.setState({ stage: 'initial' })}
          visible={!!this.state.targetUrl}
        >
          <WebView
            source={{uri: this.state.targetUrl}}
            onNavigationStateChange={this.navigation}
          />
        </Modal>
      ),

      confirmation: (<ActivityIndicator animating size='large' />)
    }[stage]
  }

  render () {
    return (
      <View style={this.styles.view}>
        {this.renderStage(this.state.stage, this.props.user)}
      </View>
    )
  }
}

function stateParam (loginStyle, credentialToken, redirectUrl) {
  var state = {
    loginStyle: loginStyle,
    credentialToken: credentialToken
  }
  if (loginStyle === 'redirect') state.redirectUrl = redirectUrl || null
  return Base64.encode(JSON.stringify(state))
}

export default createContainer((params) => {
  return {
    user: Meteor.user()
  }
}, Login)
