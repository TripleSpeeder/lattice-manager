
import React from 'react';
import 'antd/dist/antd.dark.css'
import { Button, Avatar, Divider, Statistic, List, Row, Card, Tag, Spin} from 'antd';
import { 
  CaretLeftOutlined, CaretRightOutlined, ClockCircleOutlined, 
  DownCircleOutlined, UpCircleOutlined, LoadingOutlined, ReloadOutlined
} from '@ant-design/icons';
import { PageContent } from '../index'
import { constants } from '../../util/helpers'
const GREEN = "#00FF00";
const RED = "#FF0000";

class Wallet extends React.Component {
  componentDidMount() {
    if (this.props.session) {
      this.props.session.getBtcWalletData()
    }
    window.addEventListener('resize', this.updateWidth);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.updateWidth);
  }

  getInnerWidth() {
    return document.getElementById('main-content-inner').offsetWidth;
  }

  // Make sure text doesn't overflow on smaller screens. We need to trim larger strings
  ensureTrimmedText(text) {
    if (!this.props.isMobile()) return text;
    const maxChars = this.getInnerWidth() / 22;
    if (text.length > maxChars) return `${text.slice(0, maxChars)}...`
    return text;
  }

  // Render a transaction in a list
  renderListItem(item) {
    // Transaction:
    /*
    value: 0.005260666000300001
    to: "0x1c96099350f13d558464ec79b9be4445aa0ef579"
    from: "0xb91bcfd9d30178e962f0d6c204ce7fd09c05d84c"
    fee: "0.0000315"
    incoming: false
    hash: "0xf1bfe45aaf8dc8ca379aa6661bf3af9f2d71f27d90a64d618e7ba1cfdba66ca5"
    currency: "ETH"
    asset: "ETH"
    height: "5394552"
    status: "Received"
    timestamp: 1573057414000
    title: "0x1c96099350f13d558464ec79b9be4445aa0ef579"
    type: "subtract"
    contractAddress: null
    link: "https://rinkeby.etherscan.io/tx/0xf1bfe45aaf8dc8ca379aa6661bf3af9f2d71f27d90a64d618e7ba1cfdba66ca5"
    lastUpdated: 1578858115022
    */

    function getValue(item) {
      // Values are in satoshis
      return (item.value / Math.pow(10, 8));
    }

    function getTitle(i) {
        return `${getValue(i)} BTC`
    }
    const isPending = item.height === -1;
    const title = getTitle(item);
    const subtitle = `To: ${this.ensureTrimmedText(item.recipient)}`;
    const label = (
      <div align={this.props.isMobile() ? "left" : "right"}>
        {!isPending ? (
          <p>
            {item.incoming ? 'Received ' : 'Sent '}
            {getDateDiffStr(item.timestamp)} ago&nbsp; 
            {item.incoming ? (
              <DownCircleOutlined style={{color: GREEN}}/>
            ) : (
              <UpCircleOutlined style={{color: RED}}/>
            )}
          </p>) : (
            <Spin indicator={(<LoadingOutlined/>)}/>
          )}
        <Button size="small" href={item.link} target="_blank">View</Button>
      </div>
    );
    const itemMeta = (
      <List.Item.Meta
        avatar={
          <Avatar src={'/BTC.png'} />
        }
        title={!isPending ? (<p>{`${title}`}</p>) : (<p><i>{`${title}`}</i></p>)}
        description={!isPending ? (<p>{`${subtitle}`}</p>) : (<p><i>{`${subtitle}`}</i></p>)}
      />
    )
    if (this.props.isMobile()) {
      return (
        <List.Item key={item.hash}>
          <Row justify='center'>{itemMeta}</Row>
          <Row justify='center'>{label}</Row>
        </List.Item>
      )    
    } else {
      return(
        <List.Item key={item.hash}>
          {itemMeta}
          {label}
        </List.Item>
      )
    }
  }

  renderLastUpdatedTag() {
    if (!this.props.session)
      return;
    const lastUpdated = this.props.session.lastFetchedBtcData;
    if (!lastUpdated) {
      return (
        <Tag color={'red'}>Never</Tag>
      )
    }
    const elapsedSec = Math.floor((new Date() - lastUpdated) / 1000);
    let elapsed, timeType, color;
    if (elapsedSec < 60) {
      // Just display that it was updated "seconds" ago if we're under a minute
      elapsed = '';
      timeType = 'seconds';
      color = 'green';
    } else if (elapsedSec < 3600) {
      // A couple minutes is fine, but more than 10 and there's probably a connectivity
      // problem -- display orange warning tag
      elapsed = Math.floor(elapsedSec / 60);
      timeType = elapsed === 1 ? 'min' : 'mins';
      color = 'green'
    } else if (elapsedSec < 172800) {
      // Less than a 2 days we display hours 
      elapsed = Math.floor(elapsedSec / 3600);
      timeType = elapsed === 1 ? 'hour' : 'hours';
      color = 'orange';
    } else { 
      // Otherwise display days
      elapsed = Math.floor(elapsedSec / 86400);
      timeType = 'days';
      color = 'red';
    }
    return (
      <Tag color={color}>{`${elapsed} ${timeType} ago`}</Tag>
    )
  }

  renderList() {
    const txs = {
      confirmed: this.props.session.getBtcTxs(),
      pending: this.props.session.getBtcTxs(false),
    }
    return (
      <div>
        {txs.pending.length > 0 ? (
          <Card title={<p><ClockCircleOutlined/> Pending</p>} 
                bordered={true}
                style={{ margin: '0 0 30px 0'}}>
            <List
              itemLayout="horizontal"
              dataSource={txs.pending}
              renderItem={item => (
                this.renderListItem(item)
              )}
            />
          </Card>
        ): null}
        <Card title="Transactions" bordered={true}>
          <List
            itemLayout="horizontal"
            dataSource={txs.confirmed}
            renderItem={item => (
              this.renderListItem(item)
            )}
          />
        </Card>
      </div>
    )
  }

  renderHeader() {
    const btcBalance = this.props.session.getBtcBalance() / constants.SATS_TO_BTC;
    const btcPrice = this.props.session.btcPrice;
    return (
      <div>
        <Row justify='center' style={{margin: "20px 0 0 0"}}>
            <Statistic title="Balance" value={`${btcBalance} BTC`} />
        </Row>
        <Row justify='center'>
          <Statistic title="USD Value" value={btcBalance * btcPrice} precision={2} />
        </Row>
      </div>
    )
  }

  renderPages() {
    const page = this.props.session.getPage();
    const txs = this.props.session.getBtcTxs();
    return (
      <center style={{margin: "20px 0 0 0"}}>
        {page > 1 ? (
          <Button onClick={() => {this.props.pageTurnCb(page-1)}}>
            <CaretLeftOutlined/>
          </Button>
        ) : null}
        {txs.length >= constants.PAGE_SIZE ? (
          <Button onClick={() => { this.props.pageTurnCb(page+1)}}>
            <CaretRightOutlined/>
          </Button>
        ): null}
      </center>
    )
  }

  renderStartCard() {
    return (
      <Card title={`BTC Wallet`} bordered={true}>
        <center>
          <p>You have not loaded any addresses yet.</p>
          <Button size="large" 
                  type="primary" 
                  ghost 
                  onClick={() => {this.props.refreshData()}}
          >
            Start
          </Button>
        </center>
      </Card>
    )
  }

  renderContent() {
    const lastUpdated = this.props.session.lastFetchedBtcData;
    if (!lastUpdated) {
      return this.renderStartCard();
    }
    return (
      <div>
        <Card title={`BTC Wallet`} bordered={true}>
          <Row justify='center'>
            Last Update&nbsp;{this.renderLastUpdatedTag()}
            <Button size="small" 
                    type="primary" 
                    ghost 
                    onClick={() => {this.props.refreshData()}}
            >
              Refresh <ReloadOutlined/>
            </Button>
          </Row>
          <Row justify='center' style={{margin: "20px 0 0 0"}}>
            {this.renderHeader()}
          </Row>
        </Card>
        <Divider/>
        <div>
          {this.renderList()}
          {this.renderPages()}
        </div>
      </div>
    )
  }

  render() {
    const content = (
      <center>
        {this.renderContent()}
      </center>      
    )
    return (
      <PageContent content={content} isMobile={this.props.isMobile}/>
    )
  }
}

export default Wallet

// Get a human readable, string representation of the difference
// between two dates
function getDateDiffStr(ts) {
  const then = new Date(ts);
  const now = new Date();
  const min = 1000 * 60;
  const hour = min * 60;
  const day = hour * 24;
  const week = day * 7;
  const month = week * 4;
  const year = month * 12;

  const diff = now - then;

  if (diff / min < 1) {
    return 'seconds';
  } else if (diff / hour < 1) {
    return `${Math.floor(diff/min)} minutes`;
  } else if (diff / day < 1) {
    return `${Math.floor(diff/hour)} hours`;
  } else if (diff / week < 1) {
    return `${Math.floor(diff/day)} days`;
  } else if (diff / month < 1) {
    return `${Math.floor(diff/week)} weeks`;
  } else if (diff / year < 1) {
    return `${Math.floor(diff/month)} months`;
  } else {
    return `${Math.floor(diff/year)} years`
  }

}